import { Injectable } from '@nestjs/common'
import axios, { Axios, AxiosError } from 'axios'
import { ConfigService } from '@nestjs/config'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import Handlebars from 'handlebars'
import https from 'https'
import { Command } from '@core/commands/command.type'
import { RollerShutterCommand } from '@core/commands/roller-shutter'
import {
  ACTUATOR_NAME_TRANSLATION,
  SENSOR_NAME_TRANSLATION,
  SENSOR_TYPE_MAPPERS,
  tahomaRollerShutterCommandCreator,
} from './constants'
import {
  SomfyDevice,
  SomfyEvent,
  SomfySensorChannel,
  SomfySensorChannelList,
  SomfyActuatorChannelList,
  SomfySensorTypeMapper,
} from './types'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'

const API_BASE_URL_KEY = 'tahoma.interfaceSpecific.baseUrl'
const API_AUTHORIZATION_TOKEN_KEY = 'tahoma.interfaceSpecific.authorizationToken'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class TahomaInterfaceService {
  private readonly _axios: Axios
  private readonly _sensorChannels = new SomfySensorChannelList()
  private readonly _actuatorChannels = new SomfyActuatorChannelList()

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
      .forEach(d => {
        const actuatorName = ACTUATOR_NAME_TRANSLATION[d.label]
        const transformer = (command: Command) => {
          const cmd = command as RollerShutterCommand
          return tahomaRollerShutterCommandCreator(d.deviceURL, cmd.action, cmd.position)
        }
        const actuatorChannel = new ActuatorChannel<string>(d.deviceURL, actuatorName, 'roller-shutter', transformer)
        this._actuatorChannels.add(actuatorChannel)
      })

    devices.data
      .filter(
        d =>
          !!SENSOR_NAME_TRANSLATION[d.label] &&
          ['io:RollerShutterGenericIOComponent', 'io:LightIOSystemSensor'].includes(d.controllableName),
      )
      .forEach(device => {
        const sensorNamePrefix: SomfySensorTypeMapper = SENSOR_NAME_TRANSLATION[device.label]!
        device.states.forEach(state => {
          // alle statussen overlopen, 1 device kan meerdere sensoren / actuatoren vertegenwoordigen
          //TODO onderstaande nog in constant bestand steken zoals bij de Phoscon interface
          if (SENSOR_TYPE_MAPPERS[state.name]) {
            const { nameExtension, measurementType, transformer }: SomfySensorTypeMapper =
              SENSOR_TYPE_MAPPERS[state.name]
            const channel = new SomfySensorChannel(
              device.deviceURL + '_' + state.name,
              sensorNamePrefix + nameExtension,
              measurementType,
              transformer,
            )
            this._sensorChannels.add(channel)
          }
        })
      })

    // connect to MQTT server for incoming commands
    const commandTemplate = Handlebars.compile('{{prefix}}/command/{{actuatorName}}')
    const mqttTopics = this._actuatorChannels.all.map(a => commandTemplate({ prefix: 'oha2', actuatorName: a.name }))
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)

    // register an event listener with the Tahoma box
    const result = await this._axios.post('events/register', {})
    const eventListenerId = result.data.id
    this._log.log(`Listening on ${eventListenerId}`)
    setInterval(() => this.eventPoller(eventListenerId), 500)
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
    if (event.name === 'DeviceStateChangedEvent')
      event.deviceStates.forEach(async state => {
        const channel = this._sensorChannels.get(event.deviceURL + '_' + state.name)
        if (channel) {
          const update = await channel.transformToSensorReading(state, 'Tahoma', new Date())
          this._mqttDriver.sendMeasurement(update)
        } else {
          console.log(`channel undefined for event ${state.name}`)
        }
      })
  }

  //TODO nog voorkomen dat verkeerde commando's gestuurd kunnen worden
  // testen met topic = `oha2/command/rl_living_zuid`, data = `{"action":"close"}` of `{"command":{"action":"toPosition","position":10}}`
  private async mqttCallback(actuatorName: string, cmd: Command) {
    //TODO handle messages received from MQTT
    const actuator = this._actuatorChannels.getByName(actuatorName)
    if (!actuator) {
      this._log.warn(`${actuatorName} is not defined in the actuator list`)
      return
    }
    if (actuator.type === 'roller-shutter') {
      const command = cmd as RollerShutterCommand
      const outData = tahomaRollerShutterCommandCreator(actuator.uid, command.action, command.position)
      try {
        const result = await this._axios.post('exec/apply', outData)
        const msg = {
          up: `Opening ${actuatorName}`,
          down: `Closing ${actuatorName}`,
          stop: `Stopping ${actuatorName}`,
          toPosition: `Moving ${actuatorName} to ${command.position}% closure`,
        }[command.action]
        this._log.log(`${msg}`)
      } catch (error: unknown | AxiosError) {
        if (axios.isAxiosError(error)) {
          console.error(error.message)
        } else {
          console.error(error)
        }
      }
    }
  }
}
