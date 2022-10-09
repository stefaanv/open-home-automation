import { InterfaceBase } from '@core/channel-service/interface-base.service'
import { INTERFACE_NAME_TOKEN } from '@core/core.module'
import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import axios, { Axios } from 'axios'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'
import { OpenHAB_SensorDiscoveryItem, OpenHAB_SensorForeignTypeEnum } from './types'
import { regexTest } from '@core/helpers/helpers'
import { pick } from 'lodash'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { UID } from '@core/sensors-actuators/uid.type'
import { Sensor } from '@core/sensors-actuators/sensor.class'
import { SENSOR_TYPE_MAPPERS } from './constants'

type OpenHabEvent = {
  topic: string
  payload: string
  type: string
}

type OpenHabPayload = {
  type: string
  value: string
  oldType: string
  oldValue: string
}

type OpenHAB_ForeignTypeEnum = 'unknown'

const EVENT_URL_KEY = 'openhab.general.eventUrl'
const BASE_URL_KEY = 'openhab.general.baseUrl'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`
@Injectable()
export class OpenhabInterfaceService extends InterfaceBase<OpenHAB_SensorForeignTypeEnum> {
  private readonly _eventSource!: EventSource
  private readonly _axios!: Axios

  constructor(
    @Inject(INTERFACE_NAME_TOKEN) interfaceName: string,
    log: LoggingService,
    mqttDriver: MqttDriver,
    config: ConfigService,
  ) {
    super(interfaceName, log, config, mqttDriver)
    // set log context
    this._log.setContext(OpenhabInterfaceService.name)

    const eventUrl = this._config.get<string>(EVENT_URL_KEY, '')
    if (!eventUrl) {
      this._log.warn(EVENT_URL_KEY + EMPTY_ERROR_MSG)
      return
    }

    const apiBaseUrl = this._config.get<string>(BASE_URL_KEY, '')
    if (!apiBaseUrl) {
      this._log.warn(BASE_URL_KEY + EMPTY_ERROR_MSG)
      return
    }
    this._axios = axios.create({ baseURL: apiBaseUrl, responseType: 'json' })

    // Start sensor and actuator configuration
    this.configure()

    // Setting up de SSE link to Openhab
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.sseEventHandler(evt)
    es.onerror = error => this._log.error(JSON.stringify(error))
  }

  private async configure() {
    // const discoveredActuators = await this._axios.get<Record<number, PhosconActuatorDiscoveryItem>>('lights')

    await this.configureSensors()
    // await this.configureActuators()
  }

  private sseEventHandler(evt: MessageEvent<any>) {
    console.log(JSON.stringify(evt))
  }

  private logIgnoreSensor(sensor: OpenHAB_SensorDiscoveryItem) {
    const info = pick(sensor, ['name', 'manufacturername', 'modelid', 'state'])
    this._log.debug(`Ignoring sensor ${JSON.stringify(info)}`)
  }

  private async configureSensors() {
    // Get sensor info from the Phoscon API
    const discoveredSensors = await this._axios.get<OpenHAB_SensorDiscoveryItem[]>('items')

    // store the UID's of sensors to be ignored
    this._sensorIgnoreList = discoveredSensors.data
      .filter(ds => regexTest(ds.name, this._interfaceConfig.sensorIgnore))
      .map(ds => {
        this.logIgnoreSensor(ds)
        return ds
      })
      .map(ds => ds.name as UID)
    // Transform received/discovereds - sensors
    discoveredSensors.data
      .filter(s => !this._sensorIgnoreList.includes(s.name as UID))
      .forEach(ds => {
        const id = ds.name as UID
        const typeMapper = SENSOR_TYPE_MAPPERS[ds.type]
        if (!typeMapper.measurementType) {
          this._sensorIgnoreList.push(id)
          return
        }
        const discoveryInfo = this.getNameFromConfig(id, ds.name, 'sensor')
        if (!discoveryInfo) {
          this.logIgnoreSensor(ds)
          return
        }
        const topic = ds.name
        const valueType = (discoveryInfo.type ?? typeMapper.measurementType) as MeasurementTypeEnum

        const logMessage =
          `Found sensor "${topic}", type=${typeMapper.measurementType}, id=${ds.name}` +
          `, state=${JSON.stringify(ds.state)}`
        this._log.log(logMessage)

        // push new sensor to channel list
        const sensor = new Sensor(id, topic, ds.type, valueType)
        this._sensorChannels.push(sensor)
        debugger

        // send the initial state to the hub
        // this.sendSensorStateUpdate(id, ds.state)
      })
    /*

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
  */
  }
}

/*
export class OldOpenhabInterfaceService {
  private readonly _generalTopicFilter: RegExp
  private readonly _sensorMappers: SensorMapperConfig[]
  private readonly _oldStates: Record<string, SensorReading<any>>
  private _processingStarted = false

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    this._log.setContext(OpenhabInterfaceService.name)
    this._generalTopicFilter = new RegExp(this._config.get<string>(GENERAL_TOPIC_KEY, ''))
    if (!this._generalTopicFilter) this._log.warn(GENERAL_TOPIC_KEY + EMPTY_ERROR_MSG)
    const eventUrl = this._config.get<string>(EVENT_URL_KEY, '')
    if (eventUrl) this._log.warn(EVENT_URL_KEY + EMPTY_ERROR_MSG)
    const mappersConfig = this._config.get<SensorMapperConfig[]>(MEASUREMENT_MAPPER_KEY, [])
    if (mappersConfig) this._log.warn(MEASUREMENT_MAPPER_KEY + EMPTY_ERROR_MSG)
    this._sensorMappers = mappersConfig.map(c =>
      c.type === 'generic'
        ? {
            nameFilter: new RegExp(c.nameFilter),
            measurementType: c.measurementType,
          }
        : {
            //TODO nog implementeren
          },
    )
    this._oldStates = {}

    // Setting up de SSE link to Openhab
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.sseEventHandler(evt)
    es.onerror = error => this._log.error(JSON.stringify(error))

  }

  // Openhab SSE link event handler
  private sseEventHandler(evt: MessageEvent<any>) {
    if (!this._processingStarted) {
      this._log.log(`processing of openHAB events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    if (!regexTest(evtData.topic, this._generalTopicFilter)) return // doesn't even pass the openHAB general topic filter
    const payload: OpenHabPayload = JSON.parse(evtData.payload)
    const openhabTopic = regexExtract(evtData.topic, this._generalTopicFilter, 'topic')
    const mapper = this._sensorMappers.find(sm => regexTest(openhabTopic, sm.nameFilter))
    if (mapper) {
      let value: any
      let unit: string
      let formattedValue: string
      switch (mapper.measurementType) {
        case 'temperature':
          value = parseFloat(payload.value)
          unit = '°C'
          formattedValue = (value as number).toFixed(1) + ' ' + unit
          break
        case 'humidity':
          value = parseFloat(payload.value)
          unit = '%rh'
          formattedValue = (value as number).toFixed(0) + ' ' + unit
          break
        case 'on-off':
          const valueLc = payload.value.toLocaleLowerCase()
          value = (['on', 'off'].includes(valueLc) ? valueLc : undefined) as OnOff
          unit = ''
          formattedValue = value
          break
      }
      const lastUpdate = this._oldStates[openhabTopic]

      const update = {
        time: now,
        type: mapper.measurementType,
        name: openhabTopic,
        value,
        formattedValue,
        unit,
        origin: 'openhab',
      } as SensorReading
      // const update = mapper.transformer(payload, lastUpdate, now)
      update.name = openhabTopic
      this._mqttDriver.sendSensorStateUpdate(update)
      this._oldStates[openhabTopic] = update
    }
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}
*/
