import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading, PreviousMeasurement } from '@core/sensor-reading.type'
import { SwitchPressed } from '@core/measurement-types/switch'
import { Temperature } from '@core/measurement-types/temperature'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'

type PhosconEvent = {
  e: string
  id: string
  r: string
  t: string
  attr: PhosconAttr | undefined
  state: PhosconState | undefined
  uniqueid: string
}

type PhosconAttr = {
  id: string
  lastannounced: string | null // Date
  lastseen: string | null //Date
  manufacturername: string
  modelid: string
  name: string
  swversion: string
  type: string
  uniqueid: string
}

type PhosconState = PresenceState | LightLevelState | TemperatureState
type PhosconStateTypeName = 'ZHAPresence' | 'ZHALightLevel' | 'ZHATemperature' | 'ZHAHumidity'

type BaseState = {
  lastupdated: string //date
}

type PresenceState =
  | {
      presence: boolean
    }
  | BaseState

type LightLevelState =
  | {
      dark: boolean
      daylight: boolean
      lightlevel: number
      lux: number
    }
  | BaseState

type TemperatureState =
  | {
      temperature: number
    }
  | BaseState

type HumidityState =
  | {
      humidity: number
    }
  | BaseState

type Transformer<T> = (
  sensorName: string,
  state: PhosconState,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
) => SensorReading<T>

export type SensorMapper = {
  typeFilter: RegExp
  topicFilter: RegExp
  transformer: Transformer<any>
  customConfig: any
}

export type SensorMapperConfig = {
  uid: string
  type: string | undefined
  name: string
}

function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s).groups
  if (!groups) return undefined
  return groups[groupName]
}

const APIKEY_KEY = 'phoscon.apikey'
const EVENT_URL = 'phoscon.fromInterface.eventUrl'
const SENSOR_MAPPER_KEY = 'phoscon.fromInterface.sensorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly sensors: Record<string, PhosconAttr> = {}
  private readonly _sensorConfig: SensorMapperConfig[]

  private readonly _topicFilter: RegExp
  private readonly _sensorMappers: SensorMapper[]
  private readonly _oldStates: Record<string, SensorReading<any>>
  private _processingStarted = false

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    this._log.setContext(PhosconInterfaceService.name)
    this._apiKey = this._config.get<string>(APIKEY_KEY, '')
    if (!this._apiKey) this._log.warn(APIKEY_KEY + EMPTY_ERROR_MSG)
    const eventUrl = this._config.get<string>(EVENT_URL, '')
    if (!eventUrl) this._log.warn(EVENT_URL + EMPTY_ERROR_MSG)
    this._sensorConfig = this._config.get<SensorMapperConfig[]>(SENSOR_MAPPER_KEY, [])
    if (!this._sensorConfig) this._log.warn(SENSOR_MAPPER_KEY + EMPTY_ERROR_MSG)
    const ws = new WebSocket(eventUrl)
    ws.onmessage = (event: WebSocket.MessageEvent) => this.wsEventHandler(event)

    /*
    this._topicFilter = new RegExp(this._config.get<string>('phoscon.fromInterface.generalTopicFilter', ''))
    const mappersConfig = this._config.get<MeasurementMapperConfig[]>('phoscon.fromInterface.sensorMappers', [])
    this._sensorMappers = mappersConfig.map(c => ({
      topicFilter: new RegExp(c.topicFilter),
      typeFilter: new RegExp(c.typeFilter),
      transformer: { temperature: TemperatureTransformer, switch: SwitchTransformer }[c.transformer],
      customConfig: c.customConfig,
    }))
    this._oldStates = {}

    // Setting up de SSE link to Openhab
    if (!eventUrl.startsWith('http')) this._log.warn(`Suspect event URL '${eventUrl}'`)
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.sseEventHandler(evt)
    es.onerror = error => this._log.error(JSON.stringify(error))

    this._mqttDriver.subscribe(
      (tUpd: SensorReading) => this.mqttCallback(tUpd),
      [      ],
    )
    */
  }

  // Phoscon SSE link event handler
  private wsEventHandler(event: WebSocket.MessageEvent) {
    if (!this._processingStarted) {
      this._log.log(`processing of Phoscon events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const payload: PhosconEvent = JSON.parse(event.data.toString())
    if (payload.attr) {
      const uniqueId = payload.uniqueid
      if (!this.sensors[uniqueId]) {
        const config = this._sensorConfig.find(c => c.uid === uniqueId)
        if (config) {
          const sensorName = config?.name ?? 'not defined'
          this.sensors[uniqueId] = { ...payload.attr, ...config }
          const msg =
            `Sensor ${payload.attr.name} configured => ${config.name} discovered (uid=${uniqueId})` +
            `, type = ${config.type ?? 'to suppress'}`
          this._log.log(msg)
        } else {
          this._log.warn(`Undefined sensor ${payload.attr.name} (uid=${uniqueId}), type=${payload.attr.type}`)
        }
      }
    } else {
      // state change event
      const state = payload.state
      const mapper = this.sensors[payload.uniqueid]
      if (mapper) {
        this._log.debug(`${mapper.name} (${mapper.type}), value=${JSON.stringify(state)}`)
      } else {
        this._log.warn(`Undefined sensor VALUE (uid=${payload.uniqueid}), value=${JSON.stringify(state)}`)
      }
    }
    /*)
    if (!regexTest(evtData.topic, this._topicFilter)) return // doesn't even pass the Phoscon general topic filter
    const payload: PhosconPayload = JSON.parse(evtData.payload)
    const openhabTopic = regexExtract(evtData.topic, this._topicFilter, 'topic')
    this._sensorMappers.some(im => {
      if (regexTest(openhabTopic, im.topicFilter) && regexTest(payload.type, im.typeFilter)) {
        const update = im.transformer(openhabTopic, payload, now, this._oldStates, im.customConfig)
        const topicToUpdate = update.name
        this._mqttDriver.sendMeasurement(update)
        this._oldStates[topicToUpdate] = update
        return true
      }
      return false
    })
    */
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}

/*
const SwitchTransformer: Transformer<SwitchState> = (
  topic: string,
  state: PresenceState,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
): SensorReading<SwitchState> => {
  const valueLc = state.value.toLocaleLowerCase()
  const value = (['on', 'off'].includes(valueLc) ? valueLc : undefined) as SwitchState

  const lastUpdate = oldStates[topic]
  const previousState: PreviousMeasurement<SwitchState> = {
    time: lastUpdate ? lastUpdate.time : now,
    measurement: lastUpdate ? lastUpdate.measurement : undefined,
  }

  return {
    time: now,
    type: 'switch',
    name: topic,
    measurement: value,
    previousMeasurement: previousState,
  }
}

const TemperatureTransformer: Transformer<Temperature> = (
  topic: string,
  ohPayload: PhosconPayload,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
): SensorReading<Temperature> => {
  let topicToUpdate = topic.includes(customConfig.humidityTopicFilter ?? '____')
    ? topic.replace(customConfig['humidityTopicFilter'], customConfig['replaceBy'])
    : topic

  const value = parseFloat(ohPayload.value)
  let lastUpdate = oldStates[topicToUpdate]
  const previousState: PreviousMeasurement<Temperature> = {
    time: lastUpdate ? lastUpdate.time : now,
    measurement: lastUpdate ? lastUpdate.measurement : { temperature: undefined, humidity: undefined },
  }
  let newState = { ...previousState.measurement }

  if (topicToUpdate === topic) {
    newState.temperature = value
  } else {
    newState.humidity = value
  }

  return {
    time: now,
    type: 'temperature',
    name: topicToUpdate,
    measurement: newState,
    previousMeasurement: previousState,
  }
}
  */
