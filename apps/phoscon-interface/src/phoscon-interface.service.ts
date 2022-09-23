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
} from './type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { ChannelConfig, ChannelConfigRaw } from '@core/configuration/channel-config-base.class'
import { InterfaceBase } from '@core/channel-service/interface-base.service'
import { SensorChannel } from '@core/channel-service/sensor-channel.class'
import { INTERFACE_NAME_TOKEN } from '@core/core.module'
import { SensorTypeMapper } from '@core/channel-service/types'

const APIKEY_KEY = 'phoscon.general.apiKey'
const API_BASE_KEY = 'phoscon.general.baseUrl'
const EVENT_URL = 'phoscon.general.eventUrl'
const SENSOR_CONFIGURATION = 'phoscon.sensors'
const ACTUATOR_CONFIGURATION = 'phoscon.actuators'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

//TODO inkomende (mqtt) commando's valideren + foutmelding indien niet OK
@Injectable()
export class PhosconInterfaceService extends InterfaceBase<PhosconState, PhosconSensorStateTypeEnum> {
  private readonly _apiKey: string
  private _ignoreIds: number[] = []
  private _processingStarted = false
  private readonly _axios: Axios

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) private readonly interfaceName: string,
    log: LoggingService,
    mqttDriver: MqttDriver,
    config: ConfigService,
    sensorTypeMappers: Record<PhosconSensorStateTypeEnum, SensorTypeMapper<PhosconState>>,
    // @Inject(ACTUATOR_TYPE_MAPPERS_TOKEN)
    // private readonly _actuatorTypeMappers: Record<CommandTypeEnum, ActuatorTypeMapper<TFC>>,
  ) {
    super(interfaceName, log, config, mqttDriver, sensorTypeMappers)
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
    // await this.configureActuators()
    this._log.log(`configuration done, starting the listener`)

    // Start the sensors readout through WebSocket
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) this._log.warn(EVENT_URL + EMPTY_ERROR_MSG)
    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)
  }
  /*
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
  }

  private mqttCallback(actuatorName: string, cmd: Command) {
    //TODO handle messages received from MQTT
    const [channel, command] = this._actuatorChannels.toForeign(actuatorName, cmd)
    this._axios.put(`lights/${channel.uid}/state`, command)
  }
*/

  private async configureSensors() {
    // configuration pre-processing
    const sensorConfigRaw = this._config.get<ChannelConfigRaw<MeasurementTypeEnum, unknown>>(SENSOR_CONFIGURATION)
    if (!sensorConfigRaw) this._log.warn(SENSOR_CONFIGURATION + EMPTY_ERROR_MSG)
    const sensorConfig = new ChannelConfig<MeasurementTypeEnum, unknown>(sensorConfigRaw)

    // discover sensor and actuators information from phoscon
    // const discoveredSensors_old = await this._axios.get<PhosconDiscoveryItem[]>('sensors')
    // const discoveredActuators_old = await this._axios.get<PhosconDiscoveryItem[]>('lights')
    const discoveredSensors = await this._axios.get<Record<number, PhosconSensorDiscoveryItem>>('sensors')
    const discoveredActuators = await this._axios.get<Record<number, PhosconActuatorDiscoveryItem>>('lights')
    const discoveredBoth = Object.values({ ...discoveredActuators.data, ...discoveredSensors.data }).map(ds => ({
      uid: ds.uniqueid,
      name: ds.name,
      foreignTypeName: ds.type as PhosconSensorStateTypeEnum,
      state: ds.state,
    }))
    const initialStateProcessor = (state: PhosconState, channel: SensorChannel<PhosconState>) =>
      this.wsEventHandler({ data: JSON.stringify({ state, uniqueid: channel.uid }) })
    const stateLogger = (state: PhosconState) => JSON.stringify(state)
    this.sensorDiscovery(discoveredBoth, initialStateProcessor, stateLogger)
    debugger
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent | { data: string }) {
    if (!this._processingStarted) {
      this._log.log(`processing of Phoscon events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    //{"e":"changed","id":"4","r":"sensors","state":{"buttonevent":1002,"lastupdated":"2022-09-13T16:16:55.915"},"t":"event","uniqueid":"00:12:4b:00:22:42:41:25-01-0006"}
    if (payload.state && payload?.state['buttonevent']) console.log(payload.state)
    try {
      const state = payload.state
      if (state && payload.r !== 'groups' && !this._ignoreIds.includes(parseInt(payload.id))) {
        // if attr property is present then packet is repeat config
        // state change event
        //TODO transformer voor presence toevoegen
        //TODO unit toevoegen aan SensorReading
        //TODO stringValue toevoegen aan SensorReading
        const channel = super.getSensor(payload.uniqueid)
        const tr = channel.transformer(state)
        debugger
        // this._sensorChannels.sendUpdate(this._mqttDriver, payload.uniqueid, payload.state, 'phoscon', now)
        // debugger
      }
    } catch (error) {
      this._log.error(JSON.stringify(error))
      console.error(payload)
    }
  }
}
