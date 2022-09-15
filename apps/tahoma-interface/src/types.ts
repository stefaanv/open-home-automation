import { ActuatorChannelList } from '@core/channels/actuator-channel-list.class'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { SensorChannelList } from '@core/channels/sensor-channel-list.class'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

export type TahomaSensorStatesEnum =
  | 'core:LuminanceState'
  | 'core:StatusState'
  | 'core:DiscreteRSSILevelState'
  | 'core:RSSILevelState'
  | 'core:ManufacturerSettingsState'
  | 'core:ClosureState'
  | 'core:OpenClosedState'
  | 'core:TargetClosureState'
  | 'core:MovingState'
  | 'core:NameState'
  | 'core:Memorized1PositionState'

export type TahomaEventNamesEnum = 'DeviceStateChangedEvent'

export type TahomaDevice = {
  name: string | undefined
  label: string
  deviceURL: string
  available: boolean
  type: number
  states: TahomaState[]
  controllableName:
    | 'io:RollerShutterGenericIOComponent'
    | 'io:VerticalExteriorAwningIOComponent'
    | 'io:StackComponent'
    | 'io:LightIOSystemSensor'
}

export type TahomaCurrentPosition = number
export type TahomaEventValue = number | TahomaCurrentPosition | boolean
export type TahomaState = { type: number; name: TahomaEventNamesEnum; value: TahomaEventValue }

export type TahomaEvent = {
  deviceURL: string
  deviceStates: Array<TahomaState>
  name: TahomaEventNamesEnum
}

export class TahomaSensorChannel extends SensorChannel<string> {}
export class TahomaActuatorChannel extends ActuatorChannel<string> {}
export class TahomaSensorChannelList extends SensorChannelList<string> {}
export class TahomaActuatorChannelList extends ActuatorChannelList<string> {}
export type TahomaActuatorCommandTransformer = (state: Command) => any
export type TahomaSensorValueTransformer = (state: TahomaState) => SensorReadingValue
export type TahomaSensorTypeMapper = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: TahomaSensorValueTransformer
}
export type TahomaActuatorTypeMapper = {
  commandType: CommandTypeEnum
  transformer: TahomaActuatorCommandTransformer
}
