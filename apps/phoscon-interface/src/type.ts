import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-values'

export const PhosconSensorTypeEnumNames = [
  'ZHAPresence',
  'ZHALightLevel',
  'ZHATemperature',
  'ZHAHumidity',
  'ZHAOpenClose',
  'ZHAAirQuality',
  'ZHASwitch',
  'On/Off plug-in unit',
] as const
export type PhosconSensorStateTypeEnum = typeof PhosconSensorTypeEnumNames[number]

export const PhosconActuatorTypeEnumNames = [
  'On/Off plug-in unit',
  'Range extender',
  'Color temperature light',
] as const
export type PhosconActuatorTypeEnum = typeof PhosconActuatorTypeEnumNames[number]

export const PhosconActuatorModelIds = ['RaspBee II', 'SP 220', 'ConBee II', 'TS0207', 'CCT Light']

export type PhosconEvent = {
  e: string
  id: string
  r: string
  t: string
  attr: PhosconAttr | undefined
  config: PhosconAttr | undefined
  state: PhosconState | undefined
  uniqueid: string
}
export type PhosconDiscoveryItemBase = {
  uid: number
  etag: string
  state: PhosconState
  name: string
  uniqueid: string
  swversion: string
  modelid: string
}

export type PhosconSensorDiscoveryItem = PhosconDiscoveryItemBase & {
  type: PhosconSensorStateTypeEnum
  config: any
  ep: number
  manufacturername: string
  lastseen: string
}

export type PhosconActuatorDiscoveryItem = PhosconDiscoveryItemBase & {
  type: PhosconActuatorTypeEnum
  hascolor: boolean
  manufacturer: string
  pointsymbol: any
}

export type PhosconDiscoveryItem = PhosconSensorDiscoveryItem | PhosconActuatorDiscoveryItem

export type PhosconAttr = {
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

export type PhosconState = PhosconBaseState &
  (PresenceState | LightLevelState | TemperatureState | HumidityState | OpenClosedState | SwitchState)

export type PhosconBaseState = {
  lastupdated: string //date
}

export type PresenceState = {
  presence: boolean | undefined
  on: boolean | undefined
}

export type SwitchState = {
  buttonevent: number
}

export type LightLevelState = {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
}

export type TemperatureState = {
  temperature: number
}

export type HumidityState = {
  humidity: number
}

export type OpenClosedState = {
  open: boolean | undefined
  on: boolean | undefined
}

export type OnOffState = {
  on: boolean | undefined
}

export type PhosconReportedValue = string | number | boolean | undefined

export type PhosconOnOffCommand = {
  // bri: number
  // ct: number
  on: boolean
}
export type PhosconCommand = PhosconOnOffCommand
export type PhosconActuatorCommandTransformer = (state: Command) => PhosconCommand
export type PhosconSensorValueTransformer = (state: PhosconState) => SensorReadingValue
export type PhosconSensorTypeMapper = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: PhosconSensorValueTransformer
}
export type PhosconActuatorTypeMapper = {
  commandType: ActuatorTypeEnum
  transformer: PhosconActuatorCommandTransformer
}
