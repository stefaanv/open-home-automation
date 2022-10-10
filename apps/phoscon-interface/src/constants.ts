import { SensorTypeMapper } from '@core/channel-service/types'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import {
  PhosconSensorStateTypeEnum,
  PhosconActuatorCommandTypeEnum,
  PhosconOnOffCommand,
  PhosconForeignTypeEnum,
} from './types'

export const SENSOR_TYPE_MAPPERS: SensorTypeMapper<PhosconForeignTypeEnum> = {
  ZHALightLevel: {
    typeIndicator: 'lumi',
    measurementType: 'illuminance',
  },
  ZHAPresence: {
    typeIndicator: 'pres',
    measurementType: 'presence',
  },
  ZHATemperature: {
    typeIndicator: 'temp',
    measurementType: 'temperature',
  },
  ZHAHumidity: {
    typeIndicator: 'humi',
    measurementType: 'humidity',
  },
  ZHAOpenClose: {
    typeIndicator: 'cnct',
    measurementType: 'contact',
  },
  ZHASwitch: {
    typeIndicator: 'sw',
    measurementType: 'switch',
  },
  ZHAAirQuality: {
    typeIndicator: 'airq',
    measurementType: 'air-quality',
  },
  'Color temperature light': {
    typeIndicator: 'clgt',
    measurementType: 'colored-light',
  },
  'On/Off plug-in unit': {
    typeIndicator: 'relay',
    measurementType: 'on-off',
  },
  'Range extender': {
    typeIndicator: 'range-ext',
    measurementType: undefined,
  },
}

export const ACTUATOR_TYPE_MAPPERS: Record<
  PhosconActuatorCommandTypeEnum,
  { typeIndicator: string; measurementType: MeasurementTypeEnum; commandType: ActuatorTypeEnum }
> = {
  'On/Off plug-in unit': {
    measurementType: 'on-off',
    commandType: 'relay',
    typeIndicator: '_relay',
  },
  'Range extender': {
    measurementType: 'on-off',
    commandType: 'relay',
    typeIndicator: '_unused',
  },
  'Color temperature light': {
    measurementType: 'illuminance', //TODO moet een nieuw sensor type worden !
    commandType: 'colored-light',
    typeIndicator: '_clgt',
  },
}

/*
export const SENSOR_VALUE_MAPPERS: Record<
  MeasurementTypeEnum,
  {
    transformer: (state: PhosconState) => any
    unit: string
    formattedValue: (value: PhosconReportedValue, unit: string) => string
  }
> = {
  temperature: {
    transformer: state => (state as PhosconTemperatureState).temperature / 100,
    unit: '°C',
    formattedValue: (value, unit) => (value as number).toFixed(1) + ' ' + unit,
  },
  'air-quality': {
    transformer: state => (state as PhosconTemperatureState).temperature / 100,
    unit: '',
    formattedValue: (value, unit) => (value as number).toFixed(1) + ' ' + unit,
  },
  humidity: {
    transformer: state => (state as PhosconHumidityState).humidity / 100,
    unit: '%rh',
    formattedValue: (value, unit) => (value as number).toFixed(0) + ' ' + unit,
  },
  illuminance: {
    transformer: state => (state as PhosconLightLevelState).lux,
    unit: 'Lux',
    formattedValue: (value, unit) => (value as number).toFixed(0) + ' ' + unit,
  },
  presence: {
    transformer: state => {
      const presenceValue = state as PhosconPresenceState
      return presenceValue.presence ?? presenceValue.on ? 'present' : 'absent'
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  contact: {
    transformer: state => {
      const contactValue = state as PhosconOpenClosedState
      return contactValue.open ?? !contactValue.on ? 'open' : 'closed'
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  switch: {
    transformer: state => {
      const switchValue = state as PhosconSwitchState
      return switchValue.buttonevent === 1002 ? 'shortpress' : undefined
    },
    unit: '',
    formattedValue: (value, unit) => value as string,
  },
  'on-off': {
    //TODO
    transformer: state => {
      return (state as PhosconOnOffState) ? 'on' : 'off'
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
*/
