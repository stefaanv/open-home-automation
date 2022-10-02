import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'
import axios, { Axios } from 'axios'
import Handlebars from 'handlebars'
import {
  PhosconEvent,
  PhosconState,
  PhosconSensorStateTypeEnum,
  PhosconActuatorDiscoveryItem,
  PhosconSensorDiscoveryItem,
  PhosconActuatorCommandTypeEnum,
  PhosconLightLevelState,
  PhosconPresenceState,
  PhosconTemperatureState,
  PhosconHumidityState,
  PhosconOpenClosedState,
  PhosconSwitchState,
  PhosconOnOffState,
  PhosconUID,
  PhosconCommand,
  PhosconOnOffCommand,
  PhosconSensor,
  PhosconActuator,
  PhosconForeignTypeEnum,
} from './type'
import { MeasurementTypeEnum, NumericMeasurementTypeEnum } from '@core/measurement-type.enum'
import { InterfaceBase } from '@core/channel-service/interface-base.service'
import { INTERFACE_NAME_TOKEN } from '@core/core.module'
import { Command } from '@core/commands/command.type'
import { ACTUATOR_TYPE_MAPPERS, SENSOR_TYPE_MAPPERS } from './constants'
import { regexExtract, regexTest } from '@core/helpers/helpers'
import {
  Numeric,
  OnOff,
  OpenClosed,
  Presence,
  SensorReadingValue,
  SensorReadingValueWithoutType,
  SwitchPressed,
} from '@core/sensor-reading-values'
import { NewSensor } from '@core/sensors-actuators/sensor.class'
import { NewActuator } from '@core/sensors-actuators/actuator.class'
import { OnOffCommand } from '@core/commands/on-off.type'

const APIKEY_KEY = 'phoscon.general.apiKey'
const API_BASE_KEY = 'phoscon.general.baseUrl'
const EVENT_URL = 'phoscon.general.eventUrl'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

//TODO inkomende (mqtt) commando's valideren + foutmelding indien niet OK

@Injectable()
export class PhosconInterfaceService extends InterfaceBase<PhosconUID, PhosconForeignTypeEnum> {
  private readonly _apiKey: string
  private readonly _axios: Axios

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) interfaceName: string,
    log: LoggingService,
    mqttDriver: MqttDriver,
    config: ConfigService,
    // @Inject(ACTUATOR_TYPE_MAPPERS_TOKEN)
    // private readonly _actuatorTypeMappers: Record<CommandTypeEnum, ActuatorTypeMapper<TFC>>,
  ) {
    super(interfaceName, log, config, mqttDriver)
    // set log context
    this._log.setContext(PhosconInterfaceService.name)

    // retrieve API key and BASE URL from config
    this._apiKey = this._config.get<string>(APIKEY_KEY, '')
    if (!this._apiKey) this._log.warn(APIKEY_KEY + EMPTY_ERROR_MSG)
    const apiBaseUrlTemplate = Handlebars.compile(this._config.get<string>(API_BASE_KEY, ''))
    const apiBaseUrl = apiBaseUrlTemplate({ apiKey: this._apiKey })
    if (!this._apiKey) this._log.warn(API_BASE_KEY + EMPTY_ERROR_MSG)
    this._axios = axios.create({ baseURL: apiBaseUrl, responseType: 'json' })

    // Start sensor and actuator discovery
    this.configure()
  }

  private async configure() {
    const discoveredSensors = await this._axios.get<Record<number, PhosconSensorDiscoveryItem>>('sensors')
    const discoveredActuators = await this._axios.get<Record<number, PhosconActuatorDiscoveryItem>>('lights')

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
      .map(ds => ds.uniqueid as PhosconUID)

    // Transform received/discovereds - sensors
    discoveredSensors
      .filter(s => !this._sensorIgnoreList.includes(s.uniqueid as PhosconUID))
      // .filter(ds => ds.uid !== '00:15:8d:00:02:f2:42:b6-01-0006')
      .forEach(ds => {
        // collect needed info
        const id = ds.uniqueid as PhosconUID
        const typeMapper = SENSOR_TYPE_MAPPERS[ds.type]
        const matchingFilter = this._interfaceConfig.sensorDiscover.find(f => regexTest(ds.name, f.filter))
        if (!matchingFilter) {
          const msg =
            `this is no matching filter for sensor ${ds.name} and the name does not match the ignore filter` +
            ` this is probably not what you intended, please update the configuration`
          this._log.warn(msg)
          return // ignore this sensor
        }
        const topic = regexExtract(ds.name, matchingFilter.filter, 'name') + typeMapper.nameExtension
        const valueType = (matchingFilter.type ?? typeMapper.measurementType) as MeasurementTypeEnum

        const logMessage =
          `Found sensor "${topic}", type=${typeMapper.measurementType}, id=${ds.uniqueid}` +
          `, state=${JSON.stringify(ds.state)}`
        this._log.log(logMessage)

        // push new sensor to channel list
        const sensor = new NewSensor(id, topic, valueType, ds.type)
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
          if (eqCh.topic === s.topicInfix && eqCh.valueType === s.valuetype)
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
      .map(ds => ds.uniqueid as PhosconUID)

    // Transform received/discovered - actuators
    discoveredActuators
      .filter(s => !this._actuatorIgnoreList.includes(s.uniqueid as PhosconUID))
      .forEach(ds => {
        const id = ds.uniqueid as PhosconUID
        const { nameExtension, actuatorType } = ACTUATOR_TYPE_MAPPERS[ds.type]
        const matchingFilter = this._interfaceConfig.actuatorDiscover.find(f => regexTest(ds.name, f.filter))
        if (!matchingFilter) {
          const msg =
            `this is no matching filter for actuator ${ds.name} and the name does not match the ignore filter` +
            ` this is probably not what you intended, please update the configuration`
          this._log.warn(msg)
          return // ignore this sensor
        }
        debugger
      })

    /*
    // configuration pre-processing
    const actuatorConfigRaw = this._config.get<ChannelConfigRaw<CommandTypeEnum, unknown>>(ACTUATOR_CONFIGURATION)
    if (!actuatorConfigRaw) this._log.warn(ACTUATOR_CONFIGURATION + EMPTY_ERROR_MSG)
    const actuatorConfig = new ChannelConfig<CommandTypeEnum, unknown>(actuatorConfigRaw)

    // discover actuators information from phoscon
    const discoveredActuators = await this._axios.get<PhosconDiscoveryItem[]>('lights')

    // construct `selected` and `to ignore` id lists
    const allIds = Object.keys(discoveredActuators.data).map(id => parseInt(id))
    const selectedIds = allIds.filter(id => !regexTest(discoveredActuators.data[id].name, actuatorConfig.ignore))

    // Actuator discovery
    for await (const id of selectedIds) {
      // extract actuator ID
      const discovered = discoveredActuators.data[id]

      // Get mapper info from configuration
      //TODO nog `instance` mapper implementeren
      const mapperConfig = actuatorConfig.discover.find(
        dm => regexTest(discovered.name, dm.filter),
        //TODO nog branch implementeren voor instance config
      )

      if (!mapperConfig) {
        // no mapping found -> configuration needs updating
        const msg = `NO mapping for actuator "${discovered.name}", type=${discovered.type}, model=${discovered.modelid} (id=${id})`
        this._log.warn(msg)
        console.log(JSON.stringify(discovered))
      } else {
        // mapping available -> create the actuator
        const actuatorName = regexExtract(discovered.name, mapperConfig.filter, 'actuatorName')

        //convert zigbee types into AHO command types
        const typeMap: PhosconActuatorTypeMapper = ACTUATOR_TYPE_MAPPERS[discovered.type]
        if (!typeMap) {
          // actuator type not known -> this program needs updating
          this._log.warn(`Unknown actuator type ${discovered.type}, full payload below`)
          console.log(discovered)
        } else {
          const { commandType, transformer } = typeMap
          const channel = new PhosconActuatorChannel(id, actuatorName, commandType, transformer)

          this._actuatorChannels.add(channel)
          this._log.log(`New actuator defined "${actuatorName}", type=${commandType} (id=${id})`)
        }
      }
    }
    const commandTemplate = Handlebars.compile(this._config.get<string>('mqtt.commandTemplate'))
    const prefix = this._config.get<string>('mqtt.topicPrefix')
    const mqttTopics = this._actuatorChannels.all.map<string>(a => commandTemplate({ prefix, actuatorName: a.name }))
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)
*/
  }

  private mqttCallback(actuatorName: string, cmd: Command) {
    //TODO handle messages received from MQTT
    // const [channel, command] = this._actuatorChannels.toForeign(actuatorName, cmd)
    // this._axios.put(`lights/${channel.uid}/state`, command)
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent) {
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    //{"e":"changed","id":"4","r":"sensors","state":{"buttonevent":1002,"lastupdated":"2022-09-13T16:16:55.915"},"t":"event","uniqueid":"00:12:4b:00:22:42:41:25-01-0006"}
    const state = payload.state
    const id = payload.uniqueid as PhosconUID
    if (!state || payload?.r === 'groups' /*|| this._sensorIgnoreList.includes(payload.uniqueid)*/) {
      // event must be ignored in these cases
      return
    }
    if (this._sensorIgnoreList.includes(payload.uniqueid as PhosconUID)) {
      this._log.debug(`on ignorelist: ${id}, state = ${JSON.stringify(state)}`)
      return
    }
    // TODO Convert the incoming sensor state data info a sensorReading
    this.sendSensorStateUpdate(id, state)
  }

  private sendSensorStateUpdate(id: PhosconUID, state: PhosconState) {
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
      type: channel.valueType,
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

  private transformSensorState(sensor: PhosconSensor, state: PhosconState): SensorReadingValue | undefined {
    switch (sensor.foreignType) {
      case 'ZHALightLevel':
        return this.numericStateFactory(
          (state as PhosconLightLevelState).lux,
          'lux',
          'illuminance',
          (value, unit) => `${value.toFixed(0)} ${unit}`,
        )
      case 'ZHAPresence':
        const presenceState = state as PhosconPresenceState
        return (presenceState.presence ?? presenceState.on ? 'present' : 'absent') as Presence
      case 'ZHATemperature':
        return this.numericStateFactory(
          (state as PhosconTemperatureState).temperature / 100,
          '°C',
          'temperature',
          (value, unit) => `${value.toFixed(1)}${unit}`,
        )
      case 'ZHAHumidity':
        return this.numericStateFactory(
          (state as PhosconHumidityState).humidity / 100,
          '%rh',
          'humidity',
          (value, unit) => `${value.toFixed(0)}${unit}`,
        )
      case 'ZHAOpenClose':
        return (
          (state as PhosconOpenClosedState).open ?? (state as PhosconOpenClosedState).on ? 'open' : 'closed'
        ) as OpenClosed
      case 'ZHASwitch':
        return { state: (state as PhosconSwitchState).buttonevent === 1002 ? 'shortpress' : undefined } as SwitchPressed
      case 'On/Off plug-in unit':
        return ((state as PhosconOnOffState).on ? 'on' : 'off') as OnOff
      case 'ZHAAirQuality':
        return this.numericStateFactory(
          (state as PhosconTemperatureState).temperature / 100,
          '°C',
          'temperature',
          (value, unit) => `${value.toFixed(1)}${unit}`,
        )
      default:
        return undefined
    }
  }

  private transformActuatorCommand(actuator: PhosconActuator, cmd: Command): PhosconCommand {
    switch (actuator.commandType) {
      case 'relay':
        const request: boolean = (cmd as OnOffCommand).switchTo === 'on'
        return { on: request } as PhosconOnOffCommand
      case 'colored-light':
      case 'roller-shutter':
        throw new Error('Function not implemented.')
      default:
        throw new Error('Function not implemented.')
    }
  }
}
