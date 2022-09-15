import { ActuatorChannelList } from '@core/channels/actuator-channel-list.class'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { SensorChannelList } from '@core/channels/sensor-channel-list.class'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { Command } from '@core/commands/command.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SensorReadingValue } from '@core/sensor-reading-data-types'

export type SomfySensorStatesEnum =
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

export type SomfyEventNamesEnum = 'DeviceStateChangedEvent'

export type SomfyDevice = {
  name: string | undefined
  label: string
  deviceURL: string
  available: boolean
  type: number
  states: SomfyState[]
  controllableName:
    | 'io:RollerShutterGenericIOComponent'
    | 'io:VerticalExteriorAwningIOComponent'
    | 'io:StackComponent'
    | 'io:LightIOSystemSensor'
}

export type SomfyCurrentPosition = number
export type SomfyEventValue = number | SomfyCurrentPosition | boolean
export type SomfyState = { type: number; name: SomfyEventNamesEnum; value: SomfyEventValue }

export type SomfyEvent = {
  deviceURL: string
  deviceStates: Array<SomfyState>
  name: SomfyEventNamesEnum
}

export class SomfySensorChannel extends SensorChannel<string> {}
export class SomfyActuatorChannel extends ActuatorChannel<string> {}
export class SomfySensorChannelList extends SensorChannelList<string> {}
export class SomfyActuatorChannelList extends ActuatorChannelList<string> {}
export type SomfyActuatorCommandTransformer = (state: Command) => any
export type SomfySensorValueTransformer = (state: SomfyState) => SensorReadingValue
export type SomfySensorTypeMapper = {
  nameExtension: string
  measurementType: MeasurementTypeEnum
  transformer: SomfySensorValueTransformer
}
export type SomfyActuatorTypeMapper = {
  commandType: CommandTypeEnum
  transformer: SomfyActuatorCommandTransformer
}
