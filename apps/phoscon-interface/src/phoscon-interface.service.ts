import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { SensorReading } from '@core/sensor-reading.type'
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

type PresenceState = {
  presence: boolean
} & BaseState

type LightLevelState = {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
} & BaseState

type TemperatureState = {
  temperature: number
} & BaseState

type HumidityState = {
  humidity: number
} & BaseState

type Transformer<T> = (
  sensorName: string,
  state: PhosconState,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
) => SensorReading<T>

export type SensorMapper = {
  measurementType: string | undefined
}

export type SensorMapperConfig = {
  uid: string
  measurementType: string | undefined
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

const APIKEY_KEY = 'phoscon.interfaceSpecific.apikey'
const EVENT_URL = 'phoscon.fromInterface.interfaceSpecific.eventUrl'
const SENSOR_MAPPER_KEY = 'phoscon.fromInterface.sensorMappers'
const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _sensors: Record<string, PhosconAttr & SensorMapper> = {}
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
      if (!this._sensors[uniqueId]) {
        const config = this._sensorConfig.find(c => c.uid === uniqueId)
        if (config) {
          const sensorName = config?.name ?? 'not defined'
          this._sensors[uniqueId] = { ...payload.attr, ...config }
          const msg =
            `Sensor ${payload.attr.name} configured => ${config.name} discovered (uid=${uniqueId})` +
            `, type = ${config.measurementType ?? 'to suppress'}`
          this._log.log(msg)
        } else {
          this._log.warn(`Undefined sensor ${payload.attr.name} (uid=${uniqueId}), type=${payload.attr.type}`)
        }
      }
    } else {
      // state change event
      //TODO transformer voor presence toevoegen
      //TODO unit toevoegen aan SensorReading
      //TODO stringValue toevoegen aan SensorReading
      const state = payload.state
      const mapper = this._sensors[payload.uniqueid]
      if (mapper) {
        this._log.debug(`${mapper.name} (${mapper.type}), value=${JSON.stringify(state)}`)
        let value: any
        let unit: string = ''
        let formattedValue: string

        switch (mapper.measurementType) {
          case 'temperature':
            value = (payload.state as TemperatureState).temperature / 100
            unit = '°C'
            formattedValue = (value as number).toFixed(1) + ' ' + unit
            break
          case 'humidity':
            value = (payload.state as unknown as HumidityState).humidity / 100
            unit = '%rh'
            formattedValue = (value as number).toFixed(0) + ' ' + unit
            break
          case 'luminance':
            value = (payload.state as LightLevelState).lux
            unit = 'Lux'
            formattedValue = (value as number).toFixed(0) + ' ' + unit
            break
          case 'on-off':
            value = (payload.state as PresenceState).presence ? 'present' : 'absent'
            formattedValue = value
            break
        }
        const update = {
          time: now,
          type: mapper.measurementType,
          name: mapper.name,
          value,
          formattedValue,
          unit,
          origin: 'phoscon',
        } as SensorReading
        this._mqttDriver.sendMeasurement(update)
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
