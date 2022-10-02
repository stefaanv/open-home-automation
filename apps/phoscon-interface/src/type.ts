import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-values'
import { NewActuator } from '@core/sensors-actuators/actuator.class'
import { NewSensor } from '@core/sensors-actuators/sensor.class'

// TUID
export type PhosconUID = string & { type: 'phoscon-uid' }
export type PhosconSensor = NewSensor<PhosconUID, PhosconForeignTypeEnum>
export type PhosconActuator = NewActuator<PhosconUID, PhosconForeignTypeEnum>

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

export type PhosconActuatorCommandTypeEnum = typeof PhosconActuatorTypeEnumNames[number]

export type PhosconForeignTypeEnum = PhosconSensorStateTypeEnum | PhosconActuatorCommandTypeEnum

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
  type: PhosconActuatorCommandTypeEnum
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
  (
    | PhosconPresenceState
    | PhosconLightLevelState
    | PhosconTemperatureState
    | PhosconHumidityState
    | PhosconOpenClosedState
    | PhosconSwitchState
  )

export type PhosconBaseState = {
  lastupdated: string //date
}

export type PhosconPresenceState = {
  presence: boolean | undefined
  on: boolean | undefined
}

export type PhosconSwitchState = {
  buttonevent: number
}

export type PhosconLightLevelState = {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
}

export type PhosconTemperatureState = {
  temperature: number
}

export type PhosconHumidityState = {
  humidity: number
}

export type PhosconOpenClosedState = {
  open: boolean | undefined
  on: boolean | undefined
}

export type PhosconOnOffState = {
  on: boolean | undefined
}

export type PhosconReportedValue = string | number | boolean | undefined

export type PhosconOnOffCommand = {
  // bri: number
  // ct: number
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
