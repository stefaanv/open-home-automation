import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { RollerShutterActions, RollerShutterCommand } from '@core/commands/roller-shutter'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { Moving } from '@core/sensor-reading-values'
import {
  TahomaActuatorChannel,
  TahomaActuatorTypeMapper,
  TahomaSensorStatesEnum,
  TahomaSensorTypeMapper,
  TahomaState,
} from './types'

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

export const ACTUATOR_TYPE_MAPPERS: Record<ActuatorTypeEnum, TahomaActuatorTypeMapper> = {
  'on-off': undefined,
  'roller-shutter': {
    transformer: (cmd: RollerShutterCommand, channel: TahomaActuatorChannel) => {
      return tahomaRollerShutterCommandCreator(channel.uid, cmd.action, cmd.position)
    },
  } as TahomaActuatorTypeMapper,
}

export const SENSOR_TYPE_MAPPERS: Record<TahomaSensorStatesEnum, TahomaSensorTypeMapper> = {
  'core:LuminanceState': {
    nameExtension: '_illu',
    measurementType: 'illuminance' as MeasurementTypeEnum,
    transformer: v => {
      const value = v.value as number
      return {
        value: value,
        formattedValue: value.toFixed(0) + ' Lux',
        unit: 'Lux',
        type: 'illuminance',
      }
    },
  },
  'core:StatusState': undefined,
  'core:DiscreteRSSILevelState': undefined,
  'core:RSSILevelState': undefined,
  'core:ManufacturerSettingsState': undefined,
  'core:ClosureState': {
    nameExtension: '_closure',
    measurementType: 'closure' as MeasurementTypeEnum,
    transformer: (v: TahomaState) => {
      const value = v.value as number
      return {
        value: value,
        formattedValue: value.toFixed(0) + '%',
        unit: '%',
        type: 'closure',
      }
    },
  },
  'core:OpenClosedState': undefined,
  'core:TargetClosureState': undefined,
  'core:MovingState': {
    nameExtension: '_moving',
    measurementType: 'moving' as MeasurementTypeEnum,
    transformer: (v: TahomaState) => v.value as Moving,
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
