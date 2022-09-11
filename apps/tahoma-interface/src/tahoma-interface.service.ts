import { Injectable } from '@nestjs/common'
import axios, { Axios } from 'axios'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import Handlebars from 'handlebars'
import https from 'https'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { Command } from '@core/commands/actuator-command.type'
import { RollerShutterActions, RollerShutterCommand } from '@core/commands/roller-shutter'
import { Channel, ChannelList } from '@core/channel-list.class'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Moving, Numeric, SensorReadingValue } from '@core/sensor-reading-data-types'
import { SensorReading } from '@core/sensor-reading.type'

type SomfyDevice = {
  name: string | undefined
  label: string
  deviceURL: string
  available: boolean
  type: number
  controllableName:
    | 'io:RollerShutterGenericIOComponent'
    | 'io:VerticalExteriorAwningIOComponent'
    | 'io:StackComponent'
    | 'io:LightIOSystemSensor'
}

type SomfyEventValue = number | { current_position: number } | boolean
type SomfyEvent<TValue> = {
  deviceURL: string
  deviceStates: { type: number; name: string; value: TValue }[]
  name: string
}

const ACTUATOR_NAME_TRANSLATION = { 'living zuid': 'rl_living_zuid' }
const SENSOR_NAME_TRANSLATION = { 'Sun sensor': 'buiten_oost_lumi', 'living zuid': 'rl_living_zuid' }
const ROLLERSHUTTER_COMMAND_TRANSLATION: Record<RollerShutterActions, string> = {
  up: 'up',
  down: 'close',
  stop: 'stop',
  toPosition: 'setClosure',
}

const API_BASE_URL_KEY = 'tahoma.interfaceSpecific.baseUrl'
const API_AUTHORIZATION_TOKEN_KEY = 'tahoma.interfaceSpecific.authorizationToken'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

const tahomaRollerShutterCommandCreator = (
  deviceURL: string,
  action: RollerShutterActions,
  position: number | undefined,
) => {
  const commandName = ROLLERSHUTTER_COMMAND_TRANSLATION[action]
  const parameters = action === 'toPosition' ? [position] : []
  return {
    label: action,
    actions: [
      {
        deviceURL,
        commands: [
          {
            name: commandName,
            parameters,
          },
        ],
      },
    ],
  }
}

type TahomaCommand = any
type SensorChannel = Channel<string, MeasurementTypeEnum>
type ActuatorChannel = Channel<string, CommandTypeEnum, TahomaCommand>

@Injectable()
export class TahomaInterfaceService {
  private readonly _axios: Axios
  private _sensors_old: Record<string, SomfyDevice> = {} //TODO te verwijderen na v2
  private _actuators_old: Record<string, SomfyDevice> = {} //TODO te verwijderen na v2
  private readonly _sensorChannels = new ChannelList<string, SensorChannel>()
  private readonly _actuatorChannels = new ChannelList<string, ActuatorChannel>()

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    // set log context
    this._log.setContext(TahomaInterfaceService.name)

    // retriever API key and BASE URL from config
    const apiAuthToken = this._config.get<string>(API_AUTHORIZATION_TOKEN_KEY, '')
    if (!apiAuthToken) this._log.warn(API_AUTHORIZATION_TOKEN_KEY + EMPTY_ERROR_MSG)
    const apiBaseUrl = this._config.get<string>(API_BASE_URL_KEY, '')
    if (!apiBaseUrl) this._log.warn(API_BASE_URL_KEY + API_BASE_URL_KEY)

    this._axios = axios.create({
      baseURL: apiBaseUrl,
      responseType: 'json',
      headers: { Authorization: 'Bearer ' + apiAuthToken },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
    this.discover()
  }

  async discover() {
    const devices = await this._axios.get<SomfyDevice[]>('setup/devices')
    devices.data
      .filter(d => d.controllableName === 'io:RollerShutterGenericIOComponent')
      .forEach(d =>
        this._actuatorChannels.push({
          name: ACTUATOR_NAME_TRANSLATION[d.label],
          uid: d.deviceURL,
          discoveredConfig: d,
          type: 'roller-shutter',
          transformer: undefined,
        }),
      )

    devices.data
      .filter(d => ['io:LightIOSystemSensor', 'io:RollerShutterGenericIOComponent'].includes(d.controllableName))
      .forEach(d =>
        this._sensorChannels.push({
          name: SENSOR_NAME_TRANSLATION[d.label],
          uid: d.deviceURL,
          discoveredConfig: d,
          type: 'closure',
          transformer: undefined,
        }),
      )

    // connect to MQTT server for incoming commands
    const commandTemplate = Handlebars.compile('{{prefix}}/command/{{actuatorName}}')
    const mqttTopics = Object.values(this._actuators_old).map<string>(a =>
      commandTemplate({ prefix: 'oha2', actuatorName: a.name }),
    )
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)

    // register an event listener with the Tahoma box
    const result = await this._axios.post('events/register', {})
    const eventListenerId = result.data.id
    this._log.log(`Listening on ${eventListenerId}`)
    setInterval(() => this.eventPoller(eventListenerId), 2000)
  }

  private async eventPoller(eventListenerId: string) {
    const result = await this._axios.post<SomfyEvent<SomfyEventValue>[]>(`events/${eventListenerId}/fetch`, {})
    if (result.data.length > 0) {
      for await (const event of result.data) {
        await this.processSomfyEvent(event)
      }
    }
  }

  private async processSomfyEvent(event: SomfyEvent<SomfyEventValue>) {
    console.log(JSON.stringify(event))
    const sensorName = this._sensorChannels.get(event.deviceURL)?.name
    console.log(sensorName)
    if (sensorName && event.name === 'DeviceStateChangedEvent') {
      event.deviceStates.forEach(ds => {
        const update: SensorReading<Numeric | boolean> = {
          time: new Date(),
          name: sensorName,
          value: undefined,
          origin: 'Tahoma',
          type: undefined,
        }

        let value: number = ds.value as number
        switch (ds.name) {
          case 'core:ClosureState':
            value = ds.value as number
            update.type = 'closure'
            update.value = {
              value,
              formattedValue: value.toFixed(0) + '%',
              unit: '%',
            }
            update.name += '_closure'
            break
          case 'core:LuminanceState':
            update.type = 'illuminance'
            update.value = {
              value,
              formattedValue: value.toFixed(0) + ' Lux',
              unit: ' Lux',
            }
            update.name += '_illu'
            break
          case 'core:MovingState':
            update.type = 'moving'
            update.value = ds.value as boolean
            update.name += '_moving'
            break
          default:
            return
        }

        console.log(JSON.stringify(update))
        this._mqttDriver.sendMeasurement(update)
      })
    } else {
      console.log(`Unknown event for ${event.deviceURL} -> ${JSON.stringify(event)}`)
    }
  }

  private mqttCallback(actuatorName: string, cmd: Command) {
    //TODO handle messages received from MQTT
    const actuator = this._actuators_old[actuatorName]
    if (!actuator) {
      this._log.warn(`${actuatorName} is not defined in the actuator list`)
      return
    }
    if (actuator.controllableName === 'io:RollerShutterGenericIOComponent') {
      const command = cmd as RollerShutterCommand
      const outData = tahomaRollerShutterCommandCreator(actuator.deviceURL, command.action, command.position)
      this._axios.post('exec/apply', outData).then(value => {
        const msg = {
          up: `Opening ${actuatorName}`,
          down: `Closing ${actuatorName}`,
          stop: `Stopping ${actuatorName}`,
          toPosition: `Moving ${actuatorName} to ${command.position}% closure`,
        }[command.action]
        this._log.log(`${msg}. (${value.data.execId})`)
      })
    }
  }
}
