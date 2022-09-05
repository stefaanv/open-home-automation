import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'
import axios, { Axios } from 'axios'
import Handlebars from 'handlebars'
import { PhosconActuatorDiscoveryItem, PhosconEvent, PhosconSensorDiscoveryItem, PhosconState } from './phoscon-type'
import { ActuatorSwitchCommand, ACTUATOR_TYPE_MAPPERS, SENSOR_TYPE_MAPPERS } from './constants'
import { MeasurementTypeEnum } from '@core/measurement-types/measurement-type.enum'
import { regexExtract, regexTest } from '@core/configuration/helpers'
import { SensorBaseClass } from '@core/configuration/sensors/sensor-base.class'
import { CommandType } from '@core/command-types/actuator-command.type'
import { DeviceList } from '@core/configuration/sensors/sensor-list.class'
import { SensorConfig, SensorConfigBase } from '@core/configuration/sensors/sensor-config-base.class'

const APIKEY_KEY = 'phoscon.general.apiKey'
const API_BASE_KEY = 'phoscon.general.baseUrl'
const EVENT_URL = 'phoscon.general.eventUrl'
const SENSOR_CONFIGURATION = 'phoscon.sensors'
const ACTUATOR_CONFIGURATION = 'phoscon.actuators'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

type PhosconSensor = SensorBaseClass<number, PhosconSensorDiscoveryItem>
type PhosconInstanceSensorDefinition = {
  uuid: string
}

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _actuators = new DeviceList<number, PhosconActuatorDiscoveryItem>()
  private readonly _sensors = new DeviceList<number, SensorBaseClass<number, PhosconSensorDiscoveryItem>>()
  private _ignoreIds: number[] = []
  private _processingStarted = false
  private readonly _axios: Axios

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
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
    await this.configureSensors()
    await this.configureActuators()
    this._log.log(`configuration done, starting the listener`)

    // Start the sensors readout
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) this._log.warn(EVENT_URL + EMPTY_ERROR_MSG)

    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)
  }

  private async configureActuators() {
    // configuration pre-processing
    const actuatorConfigRaw =
      this._config.get<ActuatorConfigBase<string, PhosconInstanceSensorDefinition>>(ACTUATOR_CONFIGURATION)
    // if (!actuatorConfigRaw) this._log.warn(ACTUATOR_CONFIGURATION + EMPTY_ERROR_MSG)
    // const actuatorConfig = new ActuatorConfig(actuatorConfigRaw)
    /*

    // Turn strings into regex'es
    actuatorConfig.forEach(amc => {
      if (amc.type === 'generic') {
        amc.nameFilter = new RegExp(amc.nameFilter)
      } else {
        //TODO nog implementeren
      }
    })

    // discover actuators information from phoscon
    const ignoreFilter = new RegExp(config.get<string>(ACTUATOR_IGNORE_KEY))
    const actuators = await this._axios.get<Record<string, PhosconActuatorDiscoveryItem>>('lights')
    const ids = Object.keys(actuators.data).map(id => parseInt(id))

    // process the received actuator info
    for await (const id of ids) {
      // extract actuator ID
      const actuatorInfo = actuators.data[id]

      // Ignore if the name is in the ignore list
      if (regexTest(actuatorInfo.name, ignoreFilter)) {
        this._log.debug(`Ignoring sensor "${actuatorInfo.name}"`)
        continue
      }

      // Get mapper info from (pre=precessed) configuration
      const actuatorMapper = actuatorConfig.find(
        amc => (amc.type === 'generic' ? regexTest(actuatorInfo.name, amc.nameFilter as RegExp) : false),
        //TODO nog branch implementeren voor instance config
      )

      if (!actuatorMapper) {
        // no mapping found -> configuration needs updating
        const msg = `NO mapping for actuator "${actuatorInfo.name}", type=${actuatorInfo.type}, model=${actuatorInfo.modelid} (id=${id})`
        this._log.warn(msg)
        console.log(JSON.stringify(actuatorInfo))
      } else {
        // mapping available -> create the actuator
        const actuatorName =
          actuatorMapper.type === 'generic'
            ? regexExtract(actuatorInfo.name, actuatorMapper.nameFilter as RegExp, 'actuatorName')
            : actuatorMapper.name

        //convert zigbee types into AHO command types
        const typeMap = ACTUATOR_TYPE_MAPPERS[actuatorInfo.type]
        if (!typeMap) {
          // actuator type not known -> this program needs updating
          this._log.warn(`Unknown actuator type ${actuatorInfo.type}, full payload below`)
          console.log(actuatorInfo)
        } else {
          const [nameExtension, commandType] = typeMap
          this._actuators[id] = {
            ...actuatorInfo,
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
    */
  }

  private async configureSensors() {
    // configuration pre-processing
    const sensorConfigRaw =
      this._config.get<SensorConfigBase<string, PhosconInstanceSensorDefinition>>(SENSOR_CONFIGURATION)
    if (!sensorConfigRaw) this._log.warn(SENSOR_CONFIGURATION + EMPTY_ERROR_MSG)
    const sensorConfig = new SensorConfig<any>(sensorConfigRaw)

    // discover sensor and actuators information from phoscon
    const discoveredSensors = await this._axios.get<PhosconSensorDiscoveryItem[]>('sensors')
    const discoveredActuators = await this._axios.get<PhosconSensorDiscoveryItem[]>('lights')
    const discoveredDevices = { ...discoveredSensors.data, ...discoveredActuators.data }

    // construct `selected` and `to ignore` id lists
    const allIds = Object.keys(discoveredDevices).map(id => parseInt(id))
    const selectedIds = allIds.filter(id => !regexTest(discoveredDevices[id].name, sensorConfig.ignore))
    this._ignoreIds = allIds.filter(id => !selectedIds.some(i => i === id))

    // Sensor discovery
    for await (const id of selectedIds) {
      // iterate over configuration received from the interface
      const discovered = discoveredDevices[id]

      // Get mapper info from configuration
      //TODO nog `instance` mapper implementeren
      const mapperConfig = sensorConfig.discover.find(
        dm => regexTest(discovered.name, dm.filter),
        //TODO nog branch implementeren voor instance config
      )

      if (!mapperConfig) {
        // no mapping found -> configuration needs updating
        this._log.warn(
          `NO mapping in configuration for sensor "${discovered.name}", type=${discovered.type}, model=${discovered.modelid} (id=${id})`,
        )
        console.log(JSON.stringify(discovered))
      } else {
        // mapping available -> create the sensor
        const sensorName = regexExtract(discovered.name, mapperConfig.filter, 'sensorName')
        //convert zigbee types into AHO measurement types
        const typeMap = SENSOR_TYPE_MAPPERS[discovered.type ?? 'On/Off plug-in unit']
        if (!typeMap) {
          // sensor type not known -> this program needs updating
          this._log.warn(`Unknown Zigbee type ${discovered.type}, full payload below`)
          console.log(discovered)
        } else {
          const { nameExtension, measurementType, transformer, mqttSensorReading } = typeMap
          const name = sensorName + nameExtension
          const mqttValue = mqttSensorReading(name)
          const sensorMapper = {
            uid: id,
            config: discovered,
            name,
            mqttValue,
            transformer,
          } as SensorBaseClass<number, PhosconSensorDiscoveryItem>
          this._sensors.push(sensorMapper)
          this._log.log(`New sensor defined "${sensorName + nameExtension}", type=${measurementType} (id=${id})`)

          // Process initial state
          this.wsEventHandler({ data: JSON.stringify({ ...discovered, id }) })
        }
      }
    }

    // Add instance sensors from config
    // for await (const )
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent | { data: string }) {
    if (!this._processingStarted) {
      this._log.log(`processing of Phoscon events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    try {
      if (payload.state && payload.r !== 'groups' && !this._ignoreIds.includes(parseInt(payload.id))) {
        // if attr property is present then packet is repeat config
        // state change event
        //TODO transformer voor presence toevoegen
        //TODO unit toevoegen aan SensorReading
        //TODO stringValue toevoegen aan SensorReading
        const state = payload.state
        const mapper = this._sensors.get(parseInt(payload.id))
        if (mapper) {
          const mqttData = mapper.mqttValue
          if (mapper.transformer) {
            mqttData.update(mapper.transformer(state))
          } else {
            this._log.warn(`Transformer not defined for mapper ${mapper.name}`)
          }
          console.log(mqttData.toString())
          this._mqttDriver.sendMeasurement(mqttData.sensorReading)
          // this._mqttDriver.sendMeasurement(update)
          //  else {  //TODO hoort bij discovery
          //   this._log.warn(`Unknown measurement type ${mapper.typeSettings.valueType} full payload below`)
          //   console.log(payload)
          // }
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

  /*
  private mqttCallback(actuatorName: string, data: any) {
    //TODO handle messages received from MQTT
    const actuatorId = this._actuators.findIndex(a => a?.name === actuatorName)
    const actuator = this._actuators[actuatorId]
    this._axios.put(`lights/${actuatorId}/state`, { on: (data as ActuatorSwitchCommand).switch === 'on' })
  }
  */
}
