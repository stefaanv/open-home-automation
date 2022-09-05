import { Injectable } from '@nestjs/common'
import axios, { Axios } from 'axios'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import Handlebars from 'handlebars'
import https from 'https'
import { CommandType } from '@core/actuator-types/actuator-command.type'
import { RollerShutterActions, RollerShutterCommand } from '@core/actuator-types/roller-shutter.type'
import { MeasurementTypeEnum } from '@core/measurement-types/measurement-type.enum'
import { SensorReading } from '@core/sensor-reading.type'
import { Numeric } from '@core/measurement-types/numeric.type'

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

type SomfyEvent = {
  deviceURL: string
  deviceStates: { type: number; name: string; value: number | { current_position: number } }[]
  name: string
}

const ACTUATOR_NAME_TRANSLATION = { 'living zuid': 'rl_living_zuid' }
const SENSOR_NAME_TRANSLATION = { 'Sun sensor': 'buiten_oost_lumi' }
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

@Injectable()
export class TahomaInterfaceService {
  private readonly _axios: Axios
  private _sensors: Record<string, SomfyDevice> = {}
  private _actuators: Record<string, SomfyDevice> = {}

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
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
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
    this._actuators = devices.data
      .filter(d => d.controllableName === 'io:RollerShutterGenericIOComponent')
      .reduce((acc, curr) => {
        const name = ACTUATOR_NAME_TRANSLATION[curr.label]
        curr.name = name
        acc[name] = curr
        return acc
      }, {})
    this._sensors = devices.data
      .filter(d => d.controllableName === 'io:LightIOSystemSensor')
      .reduce((acc, curr) => {
        curr.name = SENSOR_NAME_TRANSLATION[curr.label]
        acc[curr.deviceURL] = curr
        return acc
      }, {})

    // connect to MQTT server for incoming commands
    const commandTemplate = Handlebars.compile('{{prefix}}/command/{{actuatorName}}')
    const mqttTopics = Object.values(this._actuators).map<string>(a =>
      commandTemplate({ prefix: 'oha', actuatorName: a.name }),
    )
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)

    // register an event listener with the Tahoma box
    const result = await this._axios.post('events/register', {})
    const eventListenerId = result.data.id
    this._log.log(`Listening on ${eventListenerId}`)
    setInterval(() => this.eventPoller(eventListenerId), 2000)
  }

  private async eventPoller(eventListenerId: string) {
    const result = await this._axios.post<SomfyEvent[]>(`events/${eventListenerId}/fetch`, {})
    if (result.data.length > 0) {
      for await (const event of result.data) {
        await this.processSomfyEvent(event)
      }
    }
  }

  private async processSomfyEvent(event: SomfyEvent) {
    const actuatorName = Object.values(this._actuators).find(a => a.deviceURL === event.deviceURL)?.name
    const sensorName = this._sensors[event.deviceURL]?.name
    const name = sensorName ?? actuatorName
    if (name && event.name === 'DeviceStateChangedEvent') {
      event.deviceStates.forEach(ds => {
        let type: MeasurementTypeEnum
        let value = ds.value as number
        let unit: string = ''
        let formattedValue: string
        switch (ds.name) {
          case 'core:ClosureState':
            type = 'closure'
            unit = ' %'
            formattedValue: value.toFixed(0) + unit
            break
          case 'core:LuminanceState':
            type = 'illuminance'
            unit = ' Lux'
            formattedValue: value.toFixed(0) + unit
            break
          case 'core:MovingState':
            type = 'moving'
            formattedValue: value.toString()
            break
          default:
            return
        }

        const update = {
          time: new Date(),
          type,
          name,
          value,
          formattedValue,
          unit,
          origin: 'Tahoma',
        } as SensorReading<Numeric>
        console.log(JSON.stringify(update))
        this._mqttDriver.sendMeasurement(update)
      })
    } else {
      console.log(`Unknown event for ${event.deviceURL} -> ${JSON.stringify(event)}`)
    }
  }

  private mqttCallback(actuatorName: string, cmd: CommandType) {
    //TODO handle messages received from MQTT
    const actuator = this._actuators[actuatorName]
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
