import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'
import axios, { Axios } from 'axios'
import Handlebars from 'handlebars'
import {
  PhosconActuatorDiscoveryItem,
  PhosconDiscoveryItem,
  PhosconEvent,
  PhosconSensorDiscoveryItem,
  PhosconState,
} from './phoscon-type'
import { ACTUATOR_TYPE_MAPPERS, SENSOR_TYPE_MAPPERS, PhosconCommand } from './constants'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { regexExtract, regexTest } from '@core/helpers/helpers'
import { Channel, ChannelList } from '@core/channel-list.class'
import { Command as Command } from '@core/commands/actuator-command.type'
import { ChannelConfig, ChannelConfigBase, ChannelConfigRaw } from '@core/configuration/channel-config-base.class'
import { SensorReadingValue } from '@core/sensor-reading-data-types'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { SensorReading } from '@core/sensor-reading.type'

const APIKEY_KEY = 'phoscon.general.apiKey'
const API_BASE_KEY = 'phoscon.general.baseUrl'
const EVENT_URL = 'phoscon.general.eventUrl'
const SENSOR_CONFIGURATION = 'phoscon.sensors'
const ACTUATOR_CONFIGURATION = 'phoscon.actuators'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

type SensorChannel = Channel<number, MeasurementTypeEnum>
type ActuatorChannel = Channel<number, CommandTypeEnum, PhosconCommand>

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _sensorChannels = new ChannelList<number, SensorChannel>()
  private readonly _actuatorChannels = new ChannelList<number, ActuatorChannel>()
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
        const typeMap = ACTUATOR_TYPE_MAPPERS[discovered.type]
        if (!typeMap) {
          // actuator type not known -> this program needs updating
          this._log.warn(`Unknown actuator type ${discovered.type}, full payload below`)
          console.log(discovered)
        } else {
          const [nameExtension, commandType, transformer] = typeMap
          const name = actuatorName + nameExtension
          const channel = {
            uid: id,
            discoveredConfig: discovered,
            name,
            type: commandType,
            transformer,
          } as ActuatorChannel

          this._actuatorChannels.push(channel)
          this._log.log(`New actuator defined "${actuatorName + nameExtension}", type=${commandType} (id=${id})`)
        }
      }
    }
    const commandTemplate = Handlebars.compile(this._config.get<string>('mqtt.commandTemplate'))
    const prefix = this._config.get<string>('mqtt.topicPrefix')
    const mqttTopics = this._actuatorChannels.all.map<string>(a => commandTemplate({ prefix, actuatorName: a.name }))
    this._mqttDriver.subscribe((actuatorName: string, data: any) => this.mqttCallback(actuatorName, data), mqttTopics)
  }

  private mqttCallback(actuatorName: string, cmd: Command) {
    //TODO handle messages received from MQTT
    const actuator = this._actuatorChannels.getByName(actuatorName)
    const phosconCmd = actuator.transformer(cmd)

    this._axios.put(`lights/${actuator.uid}/state`, phosconCmd)
  }

  private async configureSensors() {
    // configuration pre-processing
    const sensorConfigRaw = this._config.get<ChannelConfigRaw<MeasurementTypeEnum, unknown>>(SENSOR_CONFIGURATION)
    if (!sensorConfigRaw) this._log.warn(SENSOR_CONFIGURATION + EMPTY_ERROR_MSG)
    const sensorConfig = new ChannelConfig<MeasurementTypeEnum, unknown>(sensorConfigRaw)

    // discover sensor and actuators information from phoscon
    const discoveredSensors = await this._axios.get<PhosconDiscoveryItem[]>('sensors')
    const discoveredActuators = await this._axios.get<PhosconDiscoveryItem[]>('lights')
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
        const msg = `NO mapping in configuration for sensor "${discovered.name}", type=${discovered.type}, model=${discovered.modelid} (id=${id})`
        this._log.warn(msg)
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
          const { nameExtension, measurementType, transformer } = typeMap
          const name = sensorName + nameExtension
          const channel = {
            uid: id,
            discoveredConfig: discovered,
            name,
            type: measurementType,
            transformer,
          } as SensorChannel
          this._sensorChannels.push(channel)
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
        const channel = this._sensorChannels.get(parseInt(payload.id))
        if (channel) {
          if (!channel.transformer) {
            this._log.warn(`Transformer not defined for mapper ${channel.name}`)
          }
          const update = {
            name: channel.name,
            origin: 'phoscon',
            time: now,
            type: channel.type,
            value: channel.transformer(payload.state),
          } as SensorReading<SensorReadingValue>
          console.log(JSON.stringify(update))
          this._mqttDriver.sendMeasurement(update)
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
}
