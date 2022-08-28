import { ActuatorType } from '@core/actuator-type.type'
import { CommandType } from '@core/command-type.type'
import { MeasurementType } from '@core/measurement-types/measurement-type.type'
import {
  HumidityState,
  LightLevelState,
  OnOffState,
  OpenClosedState,
  PhosconReportedValue,
  PhosconState,
  PresenceState,
  SwitchState,
  TemperatureState,
} from './types'

export const SENSOR_IGNORE_LIST = ['On/Off plug-in', 'Range extender', 'Configuration', 'unknown', 'Daylight']
export const ACTUATOR_IGNORE_LIST = ['Range extender', 'Configuration']

export const SENSOR_TYPE_MAPPERS: Record<string, [string, MeasurementType]> = {
  ZHALightLevel: ['_lumi', 'luminance'],
  ZHAPresence: ['_pres', 'presence'],
  ZHATemperature: ['_temp', 'temperature'],
  ZHAHumidity: ['_humi', 'humidity'],
  ZHAAirQuality: ['_airq', 'air-quality'],
  ZHAOpenClose: ['_cnct', 'contact'],
  ZHASwitch: ['_sw', 'switch'],
  'On/Off plug-in unit': ['_cnct', 'contact'],
}

export const ACTUATOR_TYPE_MAPPERS: Record<string, [string, CommandType]> = {
  'On/Off plug-in unit': ['_relay', 'on-off'],
}

export const SENSOR_VALUE_MAPPERS: Record<
  MeasurementType,
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
  luminance: {
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
}
