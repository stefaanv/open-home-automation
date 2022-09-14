import { RollerShutterActions } from '@core/commands/roller-shutter'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { SomfyCurrentPosition, SomfySensorStatesEnum, SomfySensorValueTransformer, SomfyState } from './types'

export const ROLLERSHUTTER_COMMAND_TRANSLATION: Record<RollerShutterActions, string> = {
  up: 'up',
  open: 'up',
  down: 'close',
  close: 'close',
  stop: 'stop',
  toPosition: 'setClosure',
}
export const ACTUATOR_NAME_TRANSLATION = { 'living zuid': 'rl_living_zuid' }
export const SENSOR_NAME_TRANSLATION = { 'Sun sensor': 'buiten_oost_lumi', 'living zuid': 'rl_living_zuid' }

export const SENSOR_TYPE_MAPPERS: Record<
  SomfySensorStatesEnum,
  {
    nameExtension: string
    measurementType: MeasurementTypeEnum
    transformer: SomfySensorValueTransformer
  }
> = {
  'core:LuminanceState': {
    nameExtension: '_illu',
    measurementType: 'illuminance',
    transformer: ((value: SomfyState<number>) => ({
      value: value.value,
      formattedValue: value.value.toFixed(0) + ' Lux',
      unit: 'Lux',
    })) as SomfySensorValueTransformer,
  },
  'core:StatusState': undefined,
  'core:DiscreteRSSILevelState': undefined,
  'core:RSSILevelState': undefined,
  'core:ManufacturerSettingsState': undefined,
  'core:ClosureState': {
    nameExtension: '_closure',
    measurementType: 'closure',
    transformer: ((value: SomfyState<SomfyCurrentPosition>) => {
      return {
        value: value.value,
        formattedValue: value.value.toFixed(0) + '%',
        unit: '%',
      }
    }) as SomfySensorValueTransformer,
  },
  'core:OpenClosedState': undefined,
  'core:TargetClosureState': undefined,
  'core:MovingState': {
    nameExtension: '_moving',
    measurementType: 'moving',
    transformer: ((value: SomfyState<boolean>) => value.value) as SomfySensorValueTransformer,
  },
  'core:NameState': undefined,
  'core:Memorized1PositionState': undefined,
}

export const tahomaRollerShutterCommandCreator = (
  deviceURL: string,
  action: RollerShutterActions,
  position: number | undefined,
) => {
  const commandName = ROLLERSHUTTER_COMMAND_TRANSLATION[action]
  const parameters = action === 'toPosition' ? [position] : []
  return {
    label: action,
    actions: [
      {
        deviceURL,
        commands: [
          {
            name: commandName,
            parameters,
          },
        ],
      },
    ],
  }
}
