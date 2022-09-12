import { RollerShutterActions } from '@core/commands/roller-shutter'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { Moving, Numeric } from '@core/sensor-reading-data-types'

export const ROLLERSHUTTER_COMMAND_TRANSLATION: Record<RollerShutterActions, string> = {
  up: 'up',
  down: 'close',
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
    transformer: (value: SomfyEventValue) => Numeric | Moving
  }
> = {
  'core:LuminanceState': {
    nameExtension: '_illu',
    measurementType: 'illuminance',
    transformer: value => ({
      value: value as number,
      formattedValue: (value as number).toFixed(0) + ' Lux',
      unit: 'Lux',
    }),
  },
  'core:StatusState': undefined,
  'core:DiscreteRSSILevelState': undefined,
  'core:RSSILevelState': undefined,
  'core:ManufacturerSettingsState': undefined,
  'core:ClosureState': {
    nameExtension: '_closure',
    measurementType: 'closure',
    transformer: value => ({
      value: value as number,
      formattedValue: (value as number).toFixed(0) + '%',
      unit: '%',
    }),
  },
  'core:OpenClosedState': undefined,
  'core:TargetClosureState': undefined,
  'core:MovingState': {
    nameExtension: '_moving',
    measurementType: 'moving',
    transformer: value => value as Moving,
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
