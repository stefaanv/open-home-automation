import { Command } from '@core/commands/command.type'
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
  states: SomfyState<SomfyEventValue>[]
  controllableName:
    | 'io:RollerShutterGenericIOComponent'
    | 'io:VerticalExteriorAwningIOComponent'
    | 'io:StackComponent'
    | 'io:LightIOSystemSensor'
}

export type SomfyCurrentPosition = number
export type SomfyEventValue = number | SomfyCurrentPosition | boolean
export type SomfyState<TValue extends SomfyEventValue> = { type: number; name: SomfyEventNamesEnum; value: TValue }

export type SomfyEvent<TValue extends SomfyEventValue> = {
  deviceURL: string
  deviceStates: Array<SomfyState<TValue>>
  name: SomfyEventNamesEnum
}

export type SomfyActuatorCommandTransformer = (state: Command) => any
export type SomfySensorValueTransformer = (state: SomfyState<SomfyEventValue>) => SensorReadingValue
