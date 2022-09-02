import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading } from '@core/sensor-reading.type'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'
import { OnOff } from '@core/measurement-types/on-off.type'
import { SensorMapperConfig } from '@core/configuration/sensor-mapper-config'

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

function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s).groups
  if (!groups) return undefined
  return groups[groupName]
}

const GENERAL_TOPIC_KEY = 'openhab.fromInterface.interfaceSpecific.generalTopicFilter'
const EVENT_URL_KEY = 'openhab.fromInterface.interfaceSpecific.eventUrl'
const MEASUREMENT_MAPPER_KEY = 'openhab.fromInterface.sensorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class OpenhabInterfaceService {
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

    /*
    this._mqttDriver.subscribe(
      (tUpd: SensorReading) => this.mqttCallback(tUpd),
      [
      ],
    )
    */
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
      this._mqttDriver.sendMeasurement(update)
      this._oldStates[openhabTopic] = update
    }
  }

  private mqttCallback(t: SensorReading) {
    //TODO handle messages received from MQTT
  }
}
