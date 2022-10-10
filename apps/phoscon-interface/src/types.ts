import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-values'
import { Actuator } from '@core/sensors-actuators/actuator.class'
import { Sensor } from '@core/sensors-actuators/sensor.class'

export type PhosconSensor = Sensor<PhosconForeignTypeEnum>
export type PhosconActuator = Actuator<PhosconForeignTypeEnum>

export const PhosconSensorTypeEnumNames = [
  'ZHAPresence',
  'ZHALightLevel',
  'ZHATemperature',
  'ZHAHumidity',
  'ZHAOpenClose',
  'ZHAAirQuality',
  'ZHASwitch',
] as const
export type PhosconSensorStateTypeEnum = typeof PhosconSensorTypeEnumNames[number]

export const PhosconActuatorTypeEnumNames = [
  'On/Off plug-in unit',
  'Range extender',
  'Color temperature light',
] as const

export type PhosconActuatorTypeEnum = typeof PhosconActuatorTypeEnumNames[number]
export type PhosconForeignTypeEnum = PhosconSensorStateTypeEnum | PhosconActuatorTypeEnum

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

export type PhosconState =
  | PhosconPresenceState
  | PhosconLightLevelState
  | PhosconTemperatureState
  | PhosconHumidityState
  | PhosconOpenClosedState
  | PhosconSwitchState
  | PhosconOnOffState
  | PhosconColoredLightState

export type PhosconBaseState = {
  lastupdated: Date
}

export type PhosconPresenceState = PhosconBaseState & {
  presence: boolean | undefined
  on: boolean | undefined
}

export type PhosconSwitchState = PhosconBaseState & {
  buttonevent: number
}

export type PhosconLightLevelState = PhosconBaseState & {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
}

export type PhosconTemperatureState = PhosconBaseState & {
  temperature: number
}

export type PhosconHumidityState = PhosconBaseState & {
  humidity: number
}

export type PhosconOpenClosedState = PhosconBaseState & {
  open: boolean | undefined
  on: boolean | undefined
}

export type PhosconOnOffState = PhosconBaseState & {
  on: boolean | undefined
}

export type PhosconColoredLightState = PhosconBaseState & {
  bri: number
  ct: number
  on: boolean
  reachable: boolean
  alert: string
}

export type PhosconReportedValue = string | number | boolean | undefined

export type PhosconOnOffCommand = {
  on: boolean
}
export type PhosconColoredLightCommand = {
  bri: number
  ct: number
  on: boolean
}
export type PhosconCommand = PhosconOnOffCommand | undefined
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
