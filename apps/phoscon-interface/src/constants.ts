import { ActuatorTypeMapper } from '@core/channel-service/types'
import { Command } from '@core/commands/command.type'
import { OnOffCommand } from '@core/commands/on-off.type'
import { MeasurementTypeEnum, NumericMeasurementTypeEnum } from '@core/measurement-type.enum'
import { Numeric, OnOff, OpenClosed, Presence, SwitchPressed } from '@core/sensor-reading-values'
import {
  HumidityState,
  LightLevelState,
  OnOffState,
  OpenClosedState,
  PhosconActuatorTypeMapper,
  PhosconReportedValue,
  PhosconSensorTypeMapper,
  PhosconState,
  PhosconSensorStateTypeEnum,
  PresenceState,
  SwitchState,
  TemperatureState,
  PhosconActuatorTypeEnum,
  PhosconOnOffCommand,
} from './type'

const numericTransformer =
  (transformer: (state: PhosconState) => number, unit: string, subType: NumericMeasurementTypeEnum) =>
  (state: PhosconState) => {
    const value = transformer(state)
    return {
      value,
      unit,
      formattedValue: `${value.toFixed(0)} ${unit}`,
      type: subType,
    } as Numeric
  }

export const SENSOR_TYPE_MAPPERS: Record<PhosconSensorStateTypeEnum, PhosconSensorTypeMapper> = {
  ZHALightLevel: {
    nameExtension: '_lumi',
    measurementType: 'illuminance' as MeasurementTypeEnum,
    transformer: numericTransformer(state => (state as LightLevelState).lux, 'lux', 'illuminance'),
  },
  ZHAPresence: {
    nameExtension: '_pres',
    measurementType: 'presence' as MeasurementTypeEnum,
    transformer: state =>
      ((state as PresenceState).presence ?? (state as PresenceState).on ? 'present' : 'absent') as Presence,
  },
  ZHATemperature: {
    nameExtension: '_temp',
    measurementType: 'temperature' as MeasurementTypeEnum,
    transformer: numericTransformer(state => (state as TemperatureState).temperature / 100, '°C', 'temperature'),
  },
  ZHAHumidity: {
    nameExtension: '_humi',
    measurementType: 'humidity' as MeasurementTypeEnum,
    transformer: numericTransformer(state => (state as HumidityState).humidity / 100, '%rh', 'humidity'),
  },
  ZHAOpenClose: {
    nameExtension: '_cnct',
    measurementType: 'contact' as MeasurementTypeEnum,
    transformer: state =>
      ((state as OpenClosedState).open ?? (state as OpenClosedState).on ? 'open' : 'closed') as OpenClosed,
  },
  ZHASwitch: {
    nameExtension: '_sw',
    measurementType: 'switch' as MeasurementTypeEnum,
    transformer: state =>
      ({ state: (state as SwitchState).buttonevent === 1002 ? 'shortpress' : undefined } as SwitchPressed),
  },
  'On/Off plug-in unit': {
    nameExtension: '_cnct',
    measurementType: 'contact' as MeasurementTypeEnum,
    transformer: state => ((state as OnOffState).on ? 'on' : 'off') as OnOff,
  },
  ZHAAirQuality: {
    nameExtension: '_airq',
    measurementType: 'air-quality' as MeasurementTypeEnum,
    transformer: numericTransformer(state => (state as TemperatureState).temperature / 100, '°C', 'temperature'),
  },
}

export const ACTUATOR_TYPE_MAPPERS: Record<PhosconActuatorTypeEnum, ActuatorTypeMapper> = {
  'On/Off plug-in unit': {
    actuatorType: 'relay',
    nameExtension: '_relay',
    transformer: cmd => {
      const request: boolean = (cmd as OnOffCommand) === 'on'
      const result = { on: request }
      return result
    },
  },
  'Range extender': {
    actuatorType: undefined,
    nameExtension: '_unused',
    transformer: function (state: Command): PhosconOnOffCommand {
      throw new Error('Function not implemented.')
    },
  },
  'Color temperature light': {
    actuatorType: undefined,
    nameExtension: '_unused',
    transformer: function (state: Command): PhosconOnOffCommand {
      throw new Error('Function not implemented.')
    },
  },
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
