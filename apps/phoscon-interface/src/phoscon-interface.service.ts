import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading, PreviousMeasurement } from '@core/sensor-reading.type'
import { SwitchState } from '@core/measurement-types/switch-state'
import { Temperature } from '@core/measurement-types/temperature'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'

type PhosconEvent = {
  topic: string
  payload: string
  type: string
}

type PhosconPayload = {
  type: string
  value: string
  oldType: string
  oldValue: string
}

type Transformer<T> = (
  topic: string,
  ohPayload: PhosconPayload,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
) => SensorReading<T>

export type MeasurementMapper = {
  typeFilter: RegExp
  topicFilter: RegExp
  transformer: Transformer<any>
  customConfig: any
}

export type MeasurementMapperConfig = {
  typeFilter: string
  topicFilter: string
  transformer: string
  customConfig: any
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
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _topicFilter: RegExp
  private readonly _measurementMappers: MeasurementMapper[]
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
    const ws = new WebSocket(eventUrl)
    ws.onmessage = console.log

    /*
    this._topicFilter = new RegExp(this._config.get<string>('phoscon.fromInterface.generalTopicFilter', ''))
    const mappersConfig = this._config.get<MeasurementMapperConfig[]>('phoscon.fromInterface.measurementMappers', [])
    this._measurementMappers = mappersConfig.map(c => ({
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
  private sseEventHandler(evt: MessageEvent<any>) {
    if (!this._processingStarted) {
      this._log.log(`processing of Phoscon events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const evtData: PhosconEvent = JSON.parse(evt.data)
    if (!regexTest(evtData.topic, this._topicFilter)) return // doesn't even pass the Phoscon general topic filter
    const payload: PhosconPayload = JSON.parse(evtData.payload)
    const openhabTopic = regexExtract(evtData.topic, this._topicFilter, 'topic')
    this._measurementMappers.some(im => {
      if (regexTest(openhabTopic, im.topicFilter) && regexTest(payload.type, im.typeFilter)) {
        const update = im.transformer(openhabTopic, payload, now, this._oldStates, im.customConfig)
        const topicToUpdate = update.name
        this._mqttDriver.sendMeasurement(update)
        this._oldStates[topicToUpdate] = update
        return true
      }
      return false
    })
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}

const SwitchTransformer: Transformer<SwitchState> = (
  topic: string,
  ohPayload: PhosconPayload,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
): SensorReading<SwitchState> => {
  const valueLc = ohPayload.value.toLocaleLowerCase()
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
