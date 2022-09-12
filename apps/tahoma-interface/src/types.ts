type SomfySensorStatesEnum =
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

type SomfyEventNamesEnum = 'DeviceStateChangedEvent'

type SomfyDevice = {
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

type SomfyCurrentPosition = { current_position: number }
type SomfyEventValue = number | SomfyCurrentPosition | boolean
type SomfyState<TValue extends SomfyEventValue> = { type: number; name: SomfyEventNamesEnum; value: TValue }

type SomfyEvent<TValue extends SomfyEventValue> = {
  deviceURL: string
  deviceStates: Array<SomfyState<TValue>>
  name: SomfyEventNamesEnum
}
