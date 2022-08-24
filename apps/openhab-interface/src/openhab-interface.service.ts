import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading, PreviousMeasurement } from '@core/sensor-reading.type'
import { Temperature } from '@core/measurement-types/temperature'
import { Humidity } from '@core/measurement-types/humidity'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'
import { OnOff } from '@core/measurement-types/on-off'

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

//(payload, lastUpdate, mapper, now)
type Transformer<T> = (payload: OpenHabPayload, lastUpdate: SensorReading<T>, now: Date) => SensorReading<T>

export type SensorMapper = {
  typeFilter: RegExp
  topicFilter: RegExp
  transformer: Transformer<any>
}

export type SensorMapperConfig = {
  typeFilter: string
  topicFilter: string
  measurementType: string
}

function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s).groups
  if (!groups) return undefined
  return groups[groupName]
}

const GENERAL_TOPIC_KEY = 'openhab.fromInterface.generalTopicFilter'
const EVENT_URL_KEY = 'openhab.fromInterface.eventUrl'
const MEASUREMENT_MAPPER_KEY = 'openhab.fromInterface.sensorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class OpenhabInterfaceService {
  private readonly _topicFilter: RegExp
  private readonly _sensorMappers: SensorMapper[]
  private readonly _oldStates: Record<string, SensorReading<any>>
  private _processingStarted = false

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    this._log.setContext(OpenhabInterfaceService.name)
    this._topicFilter = new RegExp(this._config.get<string>(GENERAL_TOPIC_KEY, ''))
    if (!this._topicFilter) this._log.warn(GENERAL_TOPIC_KEY + EMPTY_ERROR_MSG)
    const eventUrl = this._config.get<string>(EVENT_URL_KEY, '')
    if (eventUrl) this._log.warn(EVENT_URL_KEY + EMPTY_ERROR_MSG)
    const mappersConfig = this._config.get<SensorMapperConfig[]>(MEASUREMENT_MAPPER_KEY, [])
    if (mappersConfig) this._log.warn(MEASUREMENT_MAPPER_KEY + EMPTY_ERROR_MSG)
    const transformerMapping = {
      temperature: TemperatureTransformer,
      humidity: HumidityTransformer,
      'on-off': OnOffTransformer,
    }
    this._sensorMappers = mappersConfig.map(c => ({
      topicFilter: new RegExp(c.topicFilter),
      typeFilter: new RegExp(c.typeFilter),
      transformer: transformerMapping[c.measurementType],
    }))
    this._oldStates = {}

    // Setting up de SSE link to Openhab
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.sseEventHandler(evt)
    es.onerror = error => this._log.error(JSON.stringify(error))

    this._mqttDriver.subscribe(
      (tUpd: SensorReading) => this.mqttCallback(tUpd),
      [
        /*'oha/#'*/
      ],
    )
  }

  // Openhab SSE link event handler
  private sseEventHandler(evt: MessageEvent<any>) {
    if (!this._processingStarted) {
      this._log.log(`processing of openHAB events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    if (!regexTest(evtData.topic, this._topicFilter)) return // doesn't even pass the openHAB general topic filter
    const payload: OpenHabPayload = JSON.parse(evtData.payload)
    const openhabTopic = regexExtract(evtData.topic, this._topicFilter, 'topic')
    const openhabType = payload.type
    const mapper = this._sensorMappers.find(
      sm => regexTest(openhabTopic, sm.topicFilter) && regexTest(payload.type, sm.typeFilter),
    )
    if (mapper) {
      const lastUpdate = this._oldStates[openhabTopic]
      const update = mapper.transformer(payload, lastUpdate, now)
      update.name = openhabTopic
      this._mqttDriver.sendMeasurement(update)
      this._oldStates[openhabTopic] = update
    }
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}

//TODO transformers nog vereenvoudigen, eigenlijk is enkel de berekening van `measurement` verschillend !!
const OnOffTransformer: Transformer<OnOff> = (
  ohPayload: OpenHabPayload,
  lastUpdate: SensorReading<OnOff>,
  now: Date,
): SensorReading<OnOff> => {
  const valueLc = ohPayload.value.toLocaleLowerCase()
  const measurement: OnOff = { on: ['on', 'off'].includes(valueLc) ? valueLc === 'on' : undefined }

  const previousState: PreviousMeasurement<OnOff> = {
    time: lastUpdate ? lastUpdate.time : now,
    measurement: lastUpdate ? lastUpdate.measurement : undefined,
  }

  return {
    time: now,
    type: 'on-off',
    name: '',
    measurement,
    previousMeasurement: previousState,
  }
}

const HumidityTransformer: Transformer<Humidity> = (
  ohPayload: OpenHabPayload,
  lastUpdate: SensorReading<Humidity>,
  now: Date,
): SensorReading<Humidity> => {
  const measurement: Humidity = { humidity: parseFloat(ohPayload.value) }
  const previousMeasurement: PreviousMeasurement<Humidity> = {
    time: lastUpdate ? lastUpdate.time : now,
    measurement: lastUpdate ? lastUpdate.measurement : { humidity: undefined },
  }

  return {
    time: now,
    type: 'humidity',
    name: '',
    measurement,
    previousMeasurement,
  }
}

const TemperatureTransformer: Transformer<Temperature> = (
  ohPayload: OpenHabPayload,
  lastUpdate: SensorReading<Temperature>,
  now: Date,
): SensorReading<Temperature> => {
  const measurement: Temperature = { temperature: parseFloat(ohPayload.value) }
  const previousMeasurement: PreviousMeasurement<Temperature> = {
    time: lastUpdate ? lastUpdate.time : now,
    measurement: lastUpdate ? lastUpdate.measurement : { temperature: undefined },
  }

  return {
    time: now,
    type: 'temperature',
    name: '',
    measurement,
    previousMeasurement,
  }
}
