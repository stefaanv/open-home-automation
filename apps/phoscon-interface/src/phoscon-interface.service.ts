import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { MeasurementType, SensorReading } from '@core/sensor-reading.type'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import WebSocket from 'ws'

type PhosconEvent = {
  e: string
  id: string
  r: string
  t: string
  attr: PhosconAttr | undefined
  config: PhosconAttr | undefined
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

type PhosconState = PresenceState | LightLevelState | TemperatureState | HumidityState | OpenClosedState | SwitchState
type PhosconStateTypeName =
  | 'ZHAPresence'
  | 'ZHALightLevel'
  | 'ZHATemperature'
  | 'ZHAHumidity'
  | 'ZHAOpenClose'
  | 'ZHAAirQuality'
  | 'ZHASwitch'

type BaseState = {
  lastupdated: string //date
}

type PresenceState = {
  presence: boolean | undefined
  on: boolean | undefined
} & BaseState

type SwitchState = {
  buttonevent: number
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

type OpenClosedState = {
  open: boolean | undefined
  on: boolean | undefined
} & BaseState

type Transformer<T> = (
  sensorName: string,
  state: PhosconState,
  now: Date,
  oldStates: Record<string, SensorReading<any>>,
  customConfig: any,
) => SensorReading<T>

export type SensorMapper = {
  nameFilter: RegExp
  measurementType: MeasurementType
}

export type SensorMapperConfig = {
  nameFilter: string
  measurementType: MeasurementType
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
const EVENT_URL = 'phoscon.fromInterface.interfaceSpecific.eventUrl'
const MEASUREMENT_MAPPER_KEY = 'phoscon.fromInterface.sensorMappers'

const EMPTY_ERROR_MSG = ` configuration setting should not be empty`

@Injectable()
export class PhosconInterfaceService {
  private readonly _apiKey: string
  private readonly _sensors: Record<string, PhosconAttr & { name: string; measurementType: MeasurementType }> = {}

  private readonly _sensorMappers: SensorMapper[]
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
    const mappersConfig = this._config.get<SensorMapperConfig[]>(MEASUREMENT_MAPPER_KEY, [])
    if (!mappersConfig) this._log.warn(MEASUREMENT_MAPPER_KEY + EMPTY_ERROR_MSG)
    this._sensorMappers = mappersConfig.map(c => ({
      nameFilter: new RegExp(c.nameFilter),
      measurementType: c.measurementType,
    }))
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
      const attr = payload.attr ?? payload.config
      if (attr) {
        const uniqueId = payload.uniqueid
        if (!this._sensors[uniqueId]) {
          // unique id niet gevonden in this._sensors
          const name = attr.name
          //TODO to suppress sensoren nog in configuratie steken
          if (
            name.startsWith('On/Off plug-in') ||
            name.startsWith('Range extender') ||
            name.startsWith('Configuration') ||
            name.startsWith('unknown')
          )
            return
          const mapper = this._sensorMappers.find(sm => regexTest(attr.name, sm.nameFilter))
          if (mapper) {
            const sensorName = regexExtract(attr.name, mapper.nameFilter, 'sensorName')
            let nameExtension: string
            let measurementType: MeasurementType
            switch (attr.type) {
              case 'ZHALightLevel':
                nameExtension = '_lumi'
                measurementType = 'luminance'
                break
              case 'ZHAPresence':
                nameExtension = '_pres'
                measurementType = 'presence'
                break
              case 'ZHATemperature':
                nameExtension = '_temp'
                measurementType = 'temperature'
                break
              case 'ZHAHumidity':
                nameExtension = '_humi'
                measurementType = 'humidity'
                break
              case 'ZHAAirQuality':
                nameExtension = '_airq'
                measurementType = 'air-quality'
                break
              case 'ZHAOpenClose':
                nameExtension = '_cnct'
                measurementType = 'contact'
                break
              case 'ZHASwitch':
                nameExtension = '_sw'
                measurementType = 'switch'
                break
              case 'On/Off plug-in unit':
              case null:
                nameExtension = '_cnct'
                measurementType = 'contact'
                break
              default:
                this._log.warn(`Unknown Zigbee type ${attr.type}, full payload below`)
                console.log(payload)
            }
            this._sensors[uniqueId] = { ...attr, measurementType, name: sensorName + nameExtension }
            this._log.log(
              `New sensor defined "${sensorName + nameExtension}", type=${measurementType} (uid=${uniqueId})`,
            )
          } else {
            this._log.warn(
              `NO mapping for sensor "${attr.name}", type=${attr.type}, model=${attr.modelid} (uid=${uniqueId})`,
            )
            console.log(payload)
          }
        }
      } else {
        // state change event
        //TODO transformer voor presence toevoegen
        //TODO unit toevoegen aan SensorReading
        //TODO stringValue toevoegen aan SensorReading
        if (payload.r === 'groups') return
        const state = payload.state
        const mapper = this._sensors[payload.uniqueid]
        if (mapper) {
          this._log.debug(`${mapper.name} (${mapper.type}), value=${JSON.stringify(state)}`)
          let value: any
          let unit: string = ''
          let formattedValue: string

          try {
            switch (mapper.measurementType) {
              case 'temperature':
                value = (payload.state as TemperatureState).temperature / 100
                unit = '°C'
                formattedValue = (value as number).toFixed(1) + ' ' + unit
                break
              case 'air-quality':
                const state = (value = (payload.state as TemperatureState).temperature / 100)
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
              case 'presence':
                const presenceValue = payload.state as PresenceState
                value = presenceValue.presence ?? presenceValue.on ? 'present' : 'absent'
                formattedValue = value
                break
              case 'contact':
                const contactValue = payload.state as OpenClosedState
                value = contactValue.open ?? !contactValue.on ? 'open' : 'closed'
                formattedValue = value
                break
              case 'switch':
                const switchValue = payload.state as SwitchState
                value = switchValue.buttonevent === 1002 ? 'shortpress' : undefined
                formattedValue = value
                break
              default:
                this._log.warn(`Unknown measurement type ${mapper.measurementType} full payload below`)
                console.log(payload)
                break
            }
          } catch (error) {
            console.error(error)
            console.error(payload)
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
