import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { pick } from 'lodash'
import WebSocket from 'ws'
import axios, { Axios } from 'axios'
import Handlebars from 'handlebars'
import {
  PhosconEvent,
  PhosconState,
  PhosconActuatorDiscoveryItem,
  PhosconSensorDiscoveryItem,
  PhosconLightLevelState,
  PhosconPresenceState,
  PhosconTemperatureState,
  PhosconHumidityState,
  PhosconOpenClosedState,
  PhosconSwitchState,
  PhosconOnOffState,
  PhosconCommand,
  PhosconOnOffCommand,
  PhosconSensor,
  PhosconActuator,
  PhosconForeignTypeEnum,
  PhosconColoredLightCommand,
  PhosconColoredLightState,
} from './types'
import { MeasurementTypeEnum, NumericMeasurementTypeEnum } from '@core/measurement-type.enum'
import { InterfaceBase } from '@core/channel-service/interface-base.service'
import { INTERFACE_NAME_TOKEN } from '@core/core.module'
import { Command } from '@core/commands/command.type'
import { ACTUATOR_TYPE_MAPPERS, SENSOR_TYPE_MAPPERS } from './constants'
import { regexTest } from '@core/helpers/helpers'
import {
  ColoredLight,
  Numeric,
  OnOff,
  OpenClosed,
  Presence,
  SensorReadingValue,
  SensorReadingValueWithoutType,
  SwitchPressed,
} from '@core/sensor-reading-values'
import { Sensor } from '@core/sensors-actuators/sensor.class'
import { Actuator } from '@core/sensors-actuators/actuator.class'
import { OnOffCommand } from '@core/commands/on-off.class'
import { CommandParser, ValidationResult } from '@core/commands/parser.class'
import { ColoredLightCommand } from '@core/commands/colored-light.class'
import { UID } from '@core/sensors-actuators/uid.type'

const APIKEY_KEY = 'phoscon.general.apiKey'
const API_BASE_KEY = 'phoscon.general.baseUrl'
const EVENT_URL = 'phoscon.general.eventUrl'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

//TODO inkomende (mqtt) commando's valideren + foutmelding indien niet OK

@Injectable()
export class PhosconInterfaceService extends InterfaceBase<PhosconForeignTypeEnum> {
  private readonly _apiKey: string
  private readonly _axios!: Axios

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) interfaceName: string,
    log: LoggingService,
    mqttDriver: MqttDriver,
    config: ConfigService,
  ) {
    super(interfaceName, log, config, mqttDriver)
    // set log context
    this._log.setContext(PhosconInterfaceService.name)

    // retrieve API key and BASE URL from config
    this._apiKey = this._config.get<string>(APIKEY_KEY, '')
    if (!this._apiKey) {
      this._log.warn(APIKEY_KEY + EMPTY_ERROR_MSG)
      return
    }
    const apiBaseUrlTemplate = Handlebars.compile(this._config.get<string>(API_BASE_KEY, ''))
    const apiBaseUrl = apiBaseUrlTemplate({ apiKey: this._apiKey })
    if (!apiBaseUrl) {
      this._log.warn(API_BASE_KEY + EMPTY_ERROR_MSG)
      return
    }
    this._axios = axios.create({ baseURL: apiBaseUrl, responseType: 'json' })

    // Start sensor and actuator configuration
    this.configure()
  }

  private async configure() {
    await this.configureSensors()
    await this.configureActuators()
  }

  private async configureSensors() {
    // Get sensor info from the Phoscon API
    const axiosResult = await this._axios.get<Record<number, PhosconSensorDiscoveryItem>>('sensors')
    const discoveredSensors = Object.values(axiosResult.data)

    // store the UID's of sensors to be ignored
    this._sensorIgnoreList = discoveredSensors
      .filter(ds => regexTest(ds.name, this._interfaceConfig.sensorIgnore))
      .map(ds => {
        const info = pick(ds, ['name', 'manufacturername', 'modelid', 'state'])
        this._log.debug(`Ignoring sensor ${JSON.stringify(info)}`)
        return ds
      })
      .map(ds => ds.uniqueid as UID)

    // Transform received/discovereds - sensors
    discoveredSensors
      .filter(s => !this._sensorIgnoreList.includes(s.uniqueid as UID))
      // .filter(ds => ds.uid !== '00:15:8d:00:02:f2:42:b6-01-0006')
      .forEach(ds => {
        const id = ds.uniqueid as UID
        const typeMapper = SENSOR_TYPE_MAPPERS[ds.type]
        const discoveryInfo = this.getNameFromConfig(id, ds.name, 'sensor')
        if (!discoveryInfo) return
        const topic = discoveryInfo.name + typeMapper.nameExtension
        const valueType = (discoveryInfo.type ?? typeMapper.measurementType) as MeasurementTypeEnum

        const logMessage =
          `Found sensor "${topic}", type=${typeMapper.measurementType}, id=${ds.uniqueid}` +
          `, state=${JSON.stringify(ds.state)}`
        this._log.log(logMessage)

        // push new sensor to channel list
        const sensor = new Sensor(id, topic, ds.type, valueType)
        this._sensorChannels.push(sensor)

        // send the initial state to the hub
        this.sendSensorStateUpdate(id, ds.state)
      })

    // Transform defined sensors
    this._interfaceConfig.sensorDefinition
      // Ignore discovered channels with the same unique ID
      .filter(s => {
        const eqCh = this._sensorChannels.find(ch => ch.id === s.id)
        if (eqCh) {
          if (eqCh.topic === s.topicInfix && eqCh.measurementType === s.valuetype)
            this._log.warn(`Channel with equal UID ${s.id} like ${s.topicInfix} already discovered`)
          else
            this._log.error(
              `Channel with equal UID ${s.id} like ${s.topicInfix}) already discovered ` +
                `- ignoring the definition, discovery takes precedence`,
            )
        }
        return true
      })

    // Start the sensors readout through Pposcon API WebSocket
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) {
      this._log.error(EVENT_URL + EMPTY_ERROR_MSG)
      return
    }
    this._log.log(`configuration done, starting the listener`)
    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)
  }

  private async configureActuators() {
    // Get actuator info from the Phoscon API
    const axiosResult = await this._axios.get<Record<number, PhosconActuatorDiscoveryItem>>('lights')
    const discoveredActuators = Object.values(axiosResult.data)

    // store the UID's of actuators to be ignored
    this._actuatorIgnoreList = discoveredActuators
      .filter(ds => regexTest(ds.name, this._interfaceConfig.actuatorIgnore))
      .map(ds => ds.uniqueid as UID)

    // Transform received/discovered - actuators
    discoveredActuators
      .filter(s => !this._actuatorIgnoreList.includes(s.uniqueid as UID))
      .forEach(da => {
        const id = da.uniqueid as UID
        const typeMapper = ACTUATOR_TYPE_MAPPERS[da.type]
        // const { nameExtension, measurementType, commandType } = ACTUATOR_TYPE_MAPPERS[da.type]
        const discoveryInfo = this.getNameFromConfig(id, da.name, 'actuator')
        if (!discoveryInfo) return
        const topic = discoveryInfo.name + typeMapper.nameExtension

        const logMessage =
          `Found actuator "${topic}", type=${typeMapper.commandType}/${typeMapper.measurementType}, id=${da.uniqueid}` +
          `, state=${JSON.stringify(da.state)}`
        this._log.log(logMessage)

        // push new sensor to channel list
        const actuator = new Actuator(id, topic, da.type, typeMapper.measurementType, typeMapper.commandType)
        this._actuatorChannels.push(actuator)

        // send the initial state to the hub
        this.sendSensorStateUpdate(id, da.state)
      })

    const commandTemplate = Handlebars.compile(this._config.get<string>('mqtt.commandTemplate'))
    const prefix = this._config.get<string>('mqtt.topicPrefix')
    const mqttTopics = this._actuatorChannels.map<string>(a => commandTemplate({ prefix, actuatorName: a.topic }))
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)
  }

  private async mqttCallback(actuatorName: string, payload: any) {
    //TODO handle messages received from MQTT
    const channel = this._actuatorChannels.find(a => a.topic === actuatorName)
    if (!channel) {
      this._log.warn(`Unknown channel for '${actuatorName}', payload = ${JSON.stringify(payload)}`)
      return
    }
    const result = await CommandParser.parse(channel.commandType, payload)
    if (result instanceof ValidationResult) {
      result.errorMessages.forEach(e => this._log.warn(e))
      return
    }
    const transformedCommand = this.transformActuatorCommand(channel, result)
    this._axios.put(`lights/${channel.id}/state`, transformedCommand)
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent) {
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    //{"e":"changed","id":"4","r":"sensors","state":{"buttonevent":1002,"lastupdated":"2022-09-13T16:16:55.915"},"t":"event","uniqueid":"00:12:4b:00:22:42:41:25-01-0006"}
    const state = payload.state
    const id = payload.uniqueid as UID
    if (!state || payload?.r === 'groups' /*|| this._sensorIgnoreList.includes(payload.uniqueid)*/) {
      // event must be ignored in these cases
      return
    }
    if (this._sensorIgnoreList.includes(payload.uniqueid as UID)) {
      this._log.debug(`on ignorelist: ${id}, state = ${JSON.stringify(state)}`)
      return
    }
    // TODO Convert the incoming sensor state data info a sensorReading
    this.sendSensorStateUpdate(id, state)
  }

  private sendSensorStateUpdate(id: UID, state: PhosconState) {
    const channel = this.getSensorChannel(id)
    if (!channel) {
      this._log.error(`channel ${id} not found - unable to send update`)
      return
    }
    const topicInfix = channel.topic
    const measurementValue = this.transformSensorState(channel, state)

    const now = new Date()
    if (!measurementValue) {
      this._log.error(`Unable to transform foreign state ${JSON.stringify(state)}`)
      return
    }
    if (typeof measurementValue === 'object' && 'type' in measurementValue)
      delete (measurementValue as SensorReadingValueWithoutType).type

    channel.state = { time: now, value: measurementValue }
    const update = {
      origin: this._interfaceName,
      time: now,
      type: channel.measurementType,
      value: measurementValue,
    }

    try {
      this._mqttDriver.sendSensorStateUpdate(topicInfix, update)
    } catch (error) {
      this._log.error(JSON.stringify(error))
    }
  }

  private numericStateFactory(
    value: number,
    unit: string,
    type: MeasurementTypeEnum,
    formatter: (value: number, unit: string) => string,
  ): Numeric {
    return { type: type as NumericMeasurementTypeEnum, unit, value, formattedValue: formatter(value, unit) }
  }

  private transformSensorState(sensor: PhosconSensor, originalState: PhosconState): SensorReadingValue | undefined {
    switch (sensor.foreignType) {
      case 'ZHALightLevel': {
        const state = originalState as PhosconLightLevelState
        return this.numericStateFactory(
          (state as PhosconLightLevelState).lux,
          'lux',
          'illuminance',
          (value, unit) => `${value.toFixed(0)} ${unit}`,
        )
      }
      case 'ZHAPresence': {
        const state = originalState as PhosconPresenceState
        return (state.presence ?? state.on ? 'present' : 'absent') as Presence
      }
      case 'ZHATemperature': {
        const state = originalState as PhosconTemperatureState
        return this.numericStateFactory(
          state.temperature / 100,
          '°C',
          'temperature',
          (value, unit) => `${value.toFixed(1)}${unit}`,
        )
      }
      case 'ZHAHumidity': {
        const state = originalState as PhosconHumidityState
        return this.numericStateFactory(
          state.humidity / 100,
          '%rh',
          'humidity',
          (value, unit) => `${value.toFixed(0)}${unit}`,
        )
      }
      case 'ZHAOpenClose': {
        const state = originalState as PhosconOpenClosedState
        return (state.open ?? state.on ? 'open' : 'closed') as OpenClosed
      }
      case 'ZHASwitch':
        const state = originalState as PhosconSwitchState
        return {
          state: state.buttonevent === 1002 ? 'shortpress' : undefined,
        } as SwitchPressed
      case 'On/Off plug-in unit': {
        const state = originalState as PhosconOnOffState
        return (state.on ? 'on' : 'off') as OnOff
      }
      case 'Color temperature light': {
        const state = originalState as PhosconColoredLightState
        return {
          brightness: state.bri,
          colorTemperature: state.ct,
          on: state.on,
          reachable: state.reachable,
          alert: state.alert,
        } as ColoredLight
      }
      case 'ZHAAirQuality': {
        const state = originalState as PhosconTemperatureState
        return this.numericStateFactory(
          state.temperature / 100,
          '°C',
          'temperature',
          (value, unit) => `${value.toFixed(1)}${unit}`,
        )
      }
      default:
        return undefined
    }
  }

  private transformActuatorCommand(actuator: PhosconActuator, cmd: Command): PhosconCommand {
    switch (actuator.commandType) {
      case 'relay':
        const onOffCmd: boolean = (cmd as OnOffCommand).action === 'on'
        return { on: onOffCmd } as PhosconOnOffCommand
      case 'colored-light':
        const lightCmd = cmd as ColoredLightCommand
        return {
          on: lightCmd.on,
          bri: lightCmd.brightness,
          ct: lightCmd.colorTemperature,
        } as PhosconColoredLightCommand
      case 'roller-shutter':
        throw new Error('Function not implemented.')
      default:
        throw new Error('Function not implemented.')
    }
  }
}
