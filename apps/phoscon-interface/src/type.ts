import { ActuatorChannelList } from '@core/channels/actuator-channel-list.class'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { SensorChannelList } from '@core/channels/sensor-channel-list.class'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

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

export type PhosconSensorDiscoveryItem = {
  uid: number
  config: any
  ep: number
  etag: string
  lastseen: string
  manufacturername: string
  modelid: string
  name: string
  state: any
  swversion: string
  type: string
  uniqueid: string
}

export type PhosconActuatorType = ''
export type PhosconActuatorDiscoveryItem = {
  uid: number
  etag: string
  hascolor: boolean
  manufacturer: string
  modelid: string
  name: string
  pointsymbol: any
  state: any
  swversion: string
  type: PhosconActuatorType
  uniqueid: string
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
  | PresenceState
  | LightLevelState
  | TemperatureState
  | HumidityState
  | OpenClosedState
  | SwitchState

export type BaseState = {
  lastupdated: string //date
}

export type PresenceState = {
  presence: boolean | undefined
  on: boolean | undefined
} & BaseState

export type SwitchState = {
  buttonevent: number
} & BaseState

export type LightLevelState = {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
} & BaseState

export type TemperatureState = {
  temperature: number
} & BaseState

export type HumidityState = {
  humidity: number
} & BaseState

export type OpenClosedState = {
  open: boolean | undefined
  on: boolean | undefined
} & BaseState

export type OnOffState = {
  on: boolean | undefined
} & BaseState

export type PhosconReportedValue = string | number | boolean | undefined

export type PhosconOnOffCommand = {
  // bri: number
  // ct: number
  on: boolean
}
export type PhosconCommand = PhosconOnOffCommand
export class PhosconSensorChannel extends SensorChannel<number> {}
export class PhosconActuatorChannel extends ActuatorChannel<number> {}
export class PhosconSensorChannelList extends SensorChannelList<number> {}
export class PhosconActuatorChannelList extends ActuatorChannelList<number> {}
export type PhosconActuatorCommandTransformer = (state: Command) => PhosconCommand
export type PhosconSensorValueTransformer = (state: PhosconState) => SensorReadingValue
export type PhosconSensorTypeMapper = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: PhosconSensorValueTransformer
}
export type PhosconActuatorTypeMapper = {
  nameExtension: string
  commandType: CommandTypeEnum
  transformer: PhosconActuatorCommandTransformer
}
