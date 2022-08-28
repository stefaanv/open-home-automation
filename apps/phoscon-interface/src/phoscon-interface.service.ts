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
  ACTUATOR_IGNORE_LIST,
  ACTUATOR_TYPE_MAPPERS,
  SENSOR_IGNORE_LIST,
  SENSOR_TYPE_MAPPERS,
  SENSOR_VALUE_MAPPERS,
} from './constants'
import { MeasurementType } from '@core/measurement-types/measurement-type.type'
import { ActuatorType } from '@core/actuator-type.type'
import { CommandType } from '@core/command-types/command-type.type'

export type SensorMapper = {
  nameFilter: RegExp
  measurementType: MeasurementType
}

export type SensorMapperConfig = {
  nameFilter: string
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
const MEASUREMENT_MAPPER_KEY = 'phoscon.fromInterface.sensorMappers'
const ACTUATOR_MAPPER_KEY = 'phoscon.fromInterface.actuatorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _actuators: Record<number, PhosconActuatorConfig & { commandType: CommandType }> = {}
  private readonly _sensors: Record<number, PhosconSensorConfig & { measurementType: MeasurementType }> = {}
  private _processingStarted = false
  private readonly _axios: Axios

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    this._log.setContext(PhosconInterfaceService.name)

    this._apiKey = this._config.get<string>(APIKEY_KEY, '')
    if (!this._apiKey) this._log.warn(APIKEY_KEY + EMPTY_ERROR_MSG)

    const apiBaseUrlTemplate = Handlebars.compile(this._config.get<string>(API_BASE_KEY, ''))
    const apiBaseUrl = apiBaseUrlTemplate({ apiKey: this._apiKey })
    if (!this._apiKey) this._log.warn(API_BASE_KEY + EMPTY_ERROR_MSG)

    this._axios = axios.create({ baseURL: apiBaseUrl, responseType: 'json' })
    this.configureActuators(_config)
    this.configureSensors(_config)
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
    console.log('ACTUATOR_IGNORE_LIST', ACTUATOR_IGNORE_LIST)
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
            commandType,
            name: actuatorName + nameExtension,
          }
          this._log.log(`New actuator defined "${actuatorName + nameExtension}", type=${commandType} (id=${id})`)
        }
      }
    }
    console.log(this._actuators)
  }

  private async configureSensors(config: ConfigService) {
    // configuration pre-processing
    const mappersConfig = this._config.get<SensorMapperConfig[]>(MEASUREMENT_MAPPER_KEY, [])
    if (!mappersConfig) this._log.warn(MEASUREMENT_MAPPER_KEY + EMPTY_ERROR_MSG)
    const sensorMappers = mappersConfig.map(c => ({
      nameFilter: new RegExp(c.nameFilter),
      measurementType: c.measurementType,
    }))

    const sensors = await this._axios.get<Record<string, PhosconSensorConfig>>('sensors')
    for (const id in sensors.data) {
      // extract sensor ID
      const sensorConfig = sensors.data[id]

      // Ignore if the name is in the ignore list
      if (SENSOR_IGNORE_LIST.some(s => sensorConfig.name.startsWith(s))) {
        this._log.warn(`Not processing sensor "${sensorConfig.name}"`)
        continue
      }

      // Get mapper info from (pre=precessed) configuration
      const mapper = sensorMappers.find(m => regexTest(sensorConfig.name, m.nameFilter))
      if (!mapper) {
        // no mapping found -> configuration needs updating
        const msg = `NO mapping for sensor "${sensorConfig.name}", type=${sensorConfig.type}, model=${sensorConfig.modelid} (id=${id})`
        this._log.warn(msg)
        console.log(JSON.stringify(sensorConfig))
      } else {
        // mapping available -> create the sensor
        const sensorName = regexExtract(sensorConfig.name, mapper.nameFilter, 'sensorName')
        const typeMap = SENSOR_TYPE_MAPPERS[sensorConfig.type ?? 'On/Off plug-in unit']
        if (!typeMap) {
          // sensor type not known -> this program needs updating
          this._log.warn(`Unknown Zigbee type ${sensorConfig.type}, full payload below`)
          console.log(config)
        } else {
          const [nameExtension, measurementType] = typeMap
          this._sensors[parseInt(id)] = {
            ...sensorConfig,
            measurementType: measurementType,
            name: sensorName + nameExtension,
          }
          this._log.log(`New sensor defined "${sensorName + nameExtension}", type=${measurementType} (id=${id})`)
        }
      }
    }

    // Start the sensors readout
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) this._log.warn(EVENT_URL + EMPTY_ERROR_MSG)

    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)
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
        const mapper = this._actuators[parseInt(payload.id)]
        if (mapper) {
          this._log.debug(`${mapper.name} (${mapper.type}), value=${JSON.stringify(state)}`)
          const valueMapper = SENSOR_VALUE_MAPPERS[mapper.commandType as MeasurementType]
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
            `VALUE of unknown sensor (uid=${payload.uniqueid}), value=${JSON.stringify(state)}, full payload below`,
          )
          console.log(payload)
        }
      }
    } catch (error) {
      this._log.error(JSON.stringify(error))
      console.error(payload)
    }
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}
