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
import { Moving, Numeric } from '@core/sensor-reading-data-types'
import { SensorReading } from '@core/sensor-reading.type'
import {
  ACTUATOR_NAME_TRANSLATION,
  SENSOR_NAME_TRANSLATION,
  SENSOR_TYPE_MAPPERS,
  tahomaRollerShutterCommandCreator,
} from './constants'

const API_BASE_URL_KEY = 'tahoma.interfaceSpecific.baseUrl'
const API_AUTHORIZATION_TOKEN_KEY = 'tahoma.interfaceSpecific.authorizationToken'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

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

    //    const sensorName = this._sensorChannels.get(event.deviceURL)?.name
    const filteredDevices = devices.data.filter(
      d =>
        !!SENSOR_NAME_TRANSLATION[d.label] &&
        ['io:RollerShutterGenericIOComponent', 'io:LightIOSystemSensor'].includes(d.controllableName),
    )
    filteredDevices.forEach(device => {
      const sensorNamePrefix = SENSOR_NAME_TRANSLATION[device.label]!
      device.states.forEach(state => {
        // alle statussen overlopen, 1 device kan meerdere sensoren / actuatoren vertegenwoordigen
        //TODO onderstaande nog in constant bestand steken zoals bij de Phoscon interface
        if (SENSOR_TYPE_MAPPERS[state.name]) {
          const { nameExtension, measurementType, transformer } = SENSOR_TYPE_MAPPERS[state.name]
          this._sensorChannels.push({
            uid: device.deviceURL + '_' + state.name,
            discoveredConfig: device,
            name: sensorNamePrefix + nameExtension,
            transformer,
            type: measurementType,
          } as SensorChannel)
        }
      })
    })

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

  private async processSomfyState(
    channel: SensorChannel,
    state: SomfyState<SomfyEventValue>,
  ): Promise<SensorReading<Numeric | Moving> | undefined> {
    const update: SensorReading<Numeric | Moving> = {
      time: new Date(),
      name: channel.name,
      value: channel.transformer(state.value) as Numeric | Moving,
      origin: 'Tahoma',
      type: channel.type,
    }
    return update
  }

  private async processSomfyEvent(event: SomfyEvent<SomfyEventValue>) {
    event.deviceStates.forEach(async state => {
      const channel = this._sensorChannels.get(event.deviceURL + '_' + state.name)
      console.log(state.name)
      if (channel && event.name === 'DeviceStateChangedEvent') {
        const update = await this.processSomfyState(channel, state)
        console.log(JSON.stringify(update))
        this._mqttDriver.sendMeasurement(update)
      }
    })
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
