import { Command } from '@core/commands/command.type'
import { CommandTypeEnum } from '@core/commands/command-type.enum'
import { OnOffCommand } from '@core/commands/on-off.type'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import {
  Numeric,
  OnOff,
  OpenClosed,
  Presence,
  SensorReadingValue,
  SwitchPressed,
} from '@core/sensor-reading-data-types'
import {
  HumidityState,
  LightLevelState,
  OnOffState,
  OpenClosedState,
  PhosconActuatorCommandTransformer,
  PhosconReportedValue,
  PhosconSensorValueTransformer,
  PhosconState,
  PresenceState,
  SwitchState,
  TemperatureState,
} from './type'

export type PhosconStateTypeName =
  | 'ZHAPresence'
  | 'ZHALightLevel'
  | 'ZHATemperature'
  | 'ZHAHumidity'
  | 'ZHAOpenClose'
  | 'ZHAAirQuality'
  | 'ZHASwitch'
  | 'On/Off plug-in unit'

//TODO ignore lists naar config verplaatsen
export const SENSOR_IGNORE_LIST = ['Range extender', 'Configuration', 'unknown', 'Daylight']
export const ACTUATOR_IGNORE_LIST = ['Range extender', 'Configuration', 'Eethoek']

const numericTransformer = (transformer: (state: PhosconState) => number, unit: string) => (state: PhosconState) => {
  const value = transformer(state)
  return {
    value,
    unit,
    formattedValue: `${value.toFixed(0)} ${unit}`,
  } as Numeric
}

export const SENSOR_TYPE_MAPPERS: Record<
  PhosconStateTypeName,
  {
    nameExtension: string
    measurementType: MeasurementTypeEnum
    transformer: PhosconSensorValueTransformer
  }
> = {
  ZHALightLevel: {
    nameExtension: '_lumi',
    measurementType: 'illuminance',
    transformer: numericTransformer(state => (state as LightLevelState).lux, 'lux'),
  },
  ZHAPresence: {
    nameExtension: '_pres',
    measurementType: 'presence',
    transformer: state =>
      ((state as PresenceState).presence ?? (state as PresenceState).on ? 'present' : 'absent') as Presence,
  },
  ZHATemperature: {
    nameExtension: '_temp',
    measurementType: 'temperature',
    transformer: numericTransformer(state => (state as TemperatureState).temperature / 100, '°C'),
  },
  ZHAHumidity: {
    nameExtension: '_humi',
    measurementType: 'humidity',
    transformer: numericTransformer(state => (state as HumidityState).humidity / 100, '%rh'),
  },
  ZHAOpenClose: {
    nameExtension: '_cnct',
    measurementType: 'contact',
    transformer: state =>
      ((state as OpenClosedState).open ?? (state as OpenClosedState).on ? 'open' : 'closed') as OpenClosed,
  },
  ZHASwitch: {
    nameExtension: '_sw',
    measurementType: 'switch',
    transformer: state =>
      ({ state: (state as SwitchState).buttonevent === 1002 ? 'shortpress' : undefined } as SwitchPressed),
  },
  'On/Off plug-in unit': {
    nameExtension: '_cnct',
    measurementType: 'contact',
    transformer: state => ((state as OnOffState).on ? 'on' : 'off') as OnOff,
  },
  ZHAAirQuality: {
    nameExtension: '_airq',
    measurementType: 'air-quality',
    transformer: numericTransformer(state => (state as TemperatureState).temperature / 100, '°C'),
  },
}

export const ACTUATOR_TYPE_MAPPERS: Record<string, [string, CommandTypeEnum, PhosconActuatorCommandTransformer]> = {
  'On/Off plug-in unit': ['_relay', 'on-off', cmd => ({ on: (cmd as OnOffCommand) === 'on' })],
}

export const SENSOR_VALUE_MAPPERS: Record<
  MeasurementTypeEnum,
  {
    transformer: (state: PhosconState) => any
    unit: string
    formattedValue: (value: PhosconReportedValue, unit: string) => string
  }
> = {
  temperature: {
    transformer: state => (state as TemperatureState).temperature / 100,
    unit: '°C',
    formattedValue: (value, unit) => (value as number).toFixed(1) + ' ' + unit,
  },
  'air-quality': {
    transformer: state => (state as TemperatureState).temperature / 100,
    unit: '',
    formattedValue: (value, unit) => (value as number).toFixed(1) + ' ' + unit,
  },
  humidity: {
    transformer: state => (state as HumidityState).humidity / 100,
    unit: '%rh',
    formattedValue: (value, unit) => (value as number).toFixed(0) + ' ' + unit,
  },
  illuminance: {
    transformer: state => (state as LightLevelState).lux,
    unit: 'Lux',
    formattedValue: (value, unit) => (value as number).toFixed(0) + ' ' + unit,
  },
  presence: {
    transformer: state => {
      const presenceValue = state as PresenceState
      return presenceValue.presence ?? presenceValue.on ? 'present' : 'absent'
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  contact: {
    transformer: state => {
      const contactValue = state as OpenClosedState
      return contactValue.open ?? !contactValue.on ? 'open' : 'closed'
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  switch: {
    transformer: state => {
      const switchValue = state as SwitchState
      return switchValue.buttonevent === 1002 ? 'shortpress' : undefined
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  'on-off': {
    //TODO
    transformer: state => {
      return (state as OnOffState) ? 'on' : 'off'
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  closure: {
    transformer: state => JSON.stringify(state),
    unit: '',
    formattedValue: (value, unit) => '',
  },
  moving: {
    transformer: state => JSON.stringify(state),
    unit: '',
    formattedValue: (value, unit) => '',
  },
  'open-closed': {
    transformer: state => JSON.stringify(state),
    unit: '',
    formattedValue: (value, unit) => '',
  },
}
