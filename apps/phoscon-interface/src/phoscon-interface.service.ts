import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading } from '@core/sensor-reading.type'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'
import axios, { Axios } from 'axios'
import Handlebars from 'handlebars'
import { PhosconActuatorConfig, PhosconEvent, PhosconSensorConfig } from './types'
import {
  ActuatorSwitchCommand,
  ACTUATOR_IGNORE_LIST,
  ACTUATOR_TYPE_MAPPERS,
  SENSOR_IGNORE_LIST,
  SENSOR_TYPE_MAPPERS,
  SENSOR_VALUE_MAPPERS,
} from './constants'
import { MeasurementType } from '@core/measurement-types/measurement-type.type'
import { ActuatorType } from '@core/actuator-types/actuator.type'
import { GenericSensorMapperConfig, SensorMapperConfig } from '@core/configuration/sensor-mapper-config'

export type SensorMapper = {
  nameFilter: RegExp
  measurementType: MeasurementType
}

export type ActuatorMapper = {
  nameFilter: RegExp
  actuatorType: ActuatorType
}

export type ActuatorMapperConfig = {
  nameFilter: string
  actuatorType: ActuatorType
}

function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s).groups
  if (!groups) return undefined
  return groups[groupName]
}

const APIKEY_KEY = 'phoscon.interfaceSpecific.apiKey'
const API_BASE_KEY = 'phoscon.interfaceSpecific.baseUrl'
const EVENT_URL = 'phoscon.fromInterface.interfaceSpecific.eventUrl'
const SENSOR_IGNORE_KEY = 'phoscon.fromInterface.ignore'
const MEASUREMENT_MAPPER_KEY = 'phoscon.fromInterface.sensorMappers'
const ACTUATOR_IGNORE_KEY = 'phoscon.toInterface.ignore'
const ACTUATOR_MAPPER_KEY = 'phoscon.toInterface.actuatorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _actuators: (PhosconActuatorConfig & { actuatorType: ActuatorType })[] = []
  private readonly _sensors: (PhosconSensorConfig & { measurementType: MeasurementType })[] = []
  private _processingStarted = false
  private readonly _axios: Axios

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    // set log context
    this._log.setContext(PhosconInterfaceService.name)

    // retriever API key from config
    this._apiKey = this._config.get<string>(APIKEY_KEY, '')
    if (!this._apiKey) this._log.warn(APIKEY_KEY + EMPTY_ERROR_MSG)

    // retriever API base url from config
    const apiBaseUrlTemplate = Handlebars.compile(this._config.get<string>(API_BASE_KEY, ''))
    const apiBaseUrl = apiBaseUrlTemplate({ apiKey: this._apiKey })
    if (!this._apiKey) this._log.warn(API_BASE_KEY + EMPTY_ERROR_MSG)
    this._axios = axios.create({ baseURL: apiBaseUrl, responseType: 'json' })

    // Start sensor and actuator discovery
    this.discovery(_config)
  }

  private async discovery(config: ConfigService) {
    await this.configureSensors(config)
    await this.configureActuators(config)
    this._log.log(`configuration done, starting the listener`)

    // Start the sensors readout
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) this._log.warn(EVENT_URL + EMPTY_ERROR_MSG)

    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)
  }

  private async configureActuators(config: ConfigService) {
    // configuration pre-processing
    const mappersConfig = this._config.get<ActuatorMapperConfig[]>(ACTUATOR_MAPPER_KEY, [])
    if (!mappersConfig) this._log.warn(ACTUATOR_MAPPER_KEY + EMPTY_ERROR_MSG)

    const actuatorMappers = mappersConfig.map(c => ({
      nameFilter: new RegExp(c.nameFilter),
      actuatorType: c.actuatorType,
    }))

    // get known actuators from phoscon
    const actuators = await this._axios.get<Record<string, PhosconActuatorConfig>>('lights')

    // process the received actuator info
    for (const id in actuators.data) {
      // extract actuator ID
      const actuatorConfig = actuators.data[id]

      // Ignore if the name is in the ignore list
      if (ACTUATOR_IGNORE_LIST.some(s => actuatorConfig.type.startsWith(s))) {
        this._log.warn(`Not processing actuator type "${actuatorConfig.type}"`)
        continue
      }

      // Get mapper info from (pre=precessed) configuration
      const mapper = actuatorMappers.find(m => regexTest(actuatorConfig.name, m.nameFilter))
      if (!mapper) {
        // no mapping found -> configuration needs updating
        const msg = `NO mapping for actuator "${actuatorConfig.name}", type=${actuatorConfig.type}, model=${actuatorConfig.modelid} (id=${id})`
        this._log.warn(msg)
        console.log(JSON.stringify(actuatorConfig))
      } else {
        // mapping available -> create the sensor
        const actuatorName = regexExtract(actuatorConfig.name, mapper.nameFilter, 'actuatorName')
        const typeMap = ACTUATOR_TYPE_MAPPERS[actuatorConfig.type]

        if (!typeMap) {
          // actuator type not known -> this program needs updating
          this._log.warn(`Unknown actuator type ${actuatorConfig.type}, full payload below`)
          console.log(actuatorConfig)
        } else {
          const [nameExtension, commandType] = typeMap
          this._actuators[parseInt(id)] = {
            ...actuatorConfig,
            actuatorType: commandType,
            name: actuatorName + nameExtension,
          }
          this._log.log(`New actuator defined "${actuatorName + nameExtension}", type=${commandType} (id=${id})`)
        }
      }
    }
    const commandTemplate = Handlebars.compile(config.get<string>('mqtt.commandTemplate'))
    const prefix = config.get<string>('mqtt.topicPrefix')
    const mqttTopics = Object.values(this._actuators).map<string>(a =>
      commandTemplate({ prefix, actuatorName: a.name }),
    )
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)
  }

  private async configureSensors(config: ConfigService) {
    // configuration pre-processing
    const sensorMapperConfig = this._config.get<SensorMapperConfig[]>(MEASUREMENT_MAPPER_KEY, [])
    if (!sensorMapperConfig) this._log.warn(MEASUREMENT_MAPPER_KEY + EMPTY_ERROR_MSG)

    // Turn strings into regex'es
    sensorMapperConfig.forEach(smc => {
      if (smc.type === 'generic') {
        smc.nameFilter = new RegExp(smc.nameFilter)
      } else {
        //TODO nog implementeren
      }
    })

    const sensorInfo = await this._axios.get<PhosconSensorConfig[]>('sensors')
    const actuatorInfo = await this._axios.get<PhosconSensorConfig[]>('lights')
    const combinedInfo = { ...actuatorInfo.data, ...sensorInfo.data }
    const ignoreFilter = new RegExp(config.get<string>(SENSOR_IGNORE_KEY))
    const ids = Object.keys(combinedInfo).map(id => parseInt(id))

    for await (const id of ids) {
      // iterate over configuration received from the interface
      const sensorInfo = combinedInfo[id]

      // Ignore if the name is in the ignore list
      if (regexTest(sensorInfo.name, ignoreFilter)) {
        this._log.warn(`Ignoring sensor "${sensorInfo.name}"`)
        continue
      }

      // Get mapper info from (pre=precessed) configuration
      //TODO nog `instance` mapper implementeren
      const sensorMapper = sensorMapperConfig.find(
        smc => (smc.type === 'generic' ? regexTest(sensorInfo.name, smc.nameFilter as RegExp) : false),
        //TODO nog branch implementeren voor instance config
      )
      if (!sensorMapper) {
        // no mapping found -> configuration needs updating
        const msg = `NO mapping for sensor "${sensorInfo.name}", type=${sensorInfo.type}, model=${sensorInfo.modelid} (id=${id})`
        this._log.warn(msg)
        console.log(JSON.stringify(sensorInfo))
      } else {
        // mapping available -> create the sensor
        const sensorName =
          sensorMapper.type === 'generic'
            ? regexExtract(sensorInfo.name, sensorMapper.nameFilter as RegExp, 'sensorName')
            : sensorMapper.name

        //convert zigbee types into AHO measurement types
        const typeMap = SENSOR_TYPE_MAPPERS[sensorInfo.type ?? 'On/Off plug-in unit']
        if (!typeMap) {
          // sensor type not known -> this program needs updating
          this._log.warn(`Unknown Zigbee type ${sensorInfo.type}, full payload below`)
          console.log(config)
        } else {
          const [nameExtension, measurementType] = typeMap
          this._sensors[id] = {
            ...sensorInfo,
            measurementType: measurementType,
            name: sensorName + nameExtension,
          }
          this._log.log(`New sensor defined "${sensorName + nameExtension}", type=${measurementType} (id=${id})`)
        }
      }
    }
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent) {
    if (!this._processingStarted) {
      this._log.log(`processing of Phoscon events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    try {
      if (payload.state && payload.r !== 'groups') {
        // if attr property is present then packet is repeat config
        // state change event
        //TODO transformer voor presence toevoegen
        //TODO unit toevoegen aan SensorReading
        //TODO stringValue toevoegen aan SensorReading
        const state = payload.state
        const mapper = this._sensors[payload.id]
        if (mapper) {
          this._log.debug(`${mapper.name} (${mapper.type}), value=${JSON.stringify(state)}`)
          const valueMapper = SENSOR_VALUE_MAPPERS[mapper.measurementType as MeasurementType]
          if (valueMapper) {
            const value: string | number = valueMapper.transformer(state)
            const unit = valueMapper.unit
            const formattedValue = valueMapper.formattedValue(value, unit)
            const update = {
              time: now,
              type: mapper.commandType,
              name: mapper.name,
              value,
              formattedValue,
              unit,
              origin: 'phoscon',
            } as SensorReading
            this._mqttDriver.sendMeasurement(update)
          } else {
            this._log.warn(`Unknown measurement type ${mapper.commandType} full payload below`)
            console.log(payload)
          }
        } else {
          this._log.warn(
            `VALUE of unknown sensor (id=${payload.id}), value=${JSON.stringify(state)}, full payload below`,
          )
          console.log(payload)
        }
      }
    } catch (error) {
      this._log.error(JSON.stringify(error))
      console.error(payload)
    }
  }

  private mqttCallback(actuatorName: string, data: any) {
    //TODO handle messages received from MQTT
    const actuatorId = this._actuators.findIndex(a => a?.name === actuatorName)
    const actuator = this._actuators[actuatorId]
    this._axios.put(`lights/${actuatorId}/state`, { on: (data as ActuatorSwitchCommand).switch === 'on' })
  }
}
