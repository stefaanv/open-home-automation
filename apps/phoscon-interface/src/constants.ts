import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { PhosconSensorStateTypeEnum, PhosconActuatorCommandTypeEnum, PhosconOnOffCommand } from './types'

export const SENSOR_TYPE_MAPPERS: Record<
  PhosconSensorStateTypeEnum,
  { nameExtension: string; measurementType: MeasurementTypeEnum }
> = {
  ZHALightLevel: {
    nameExtension: '_lumi',
    measurementType: 'illuminance',
  },
  ZHAPresence: {
    nameExtension: '_pres',
    measurementType: 'presence',
  },
  ZHATemperature: {
    nameExtension: '_temp',
    measurementType: 'temperature',
  },
  ZHAHumidity: {
    nameExtension: '_humi',
    measurementType: 'humidity',
  },
  ZHAOpenClose: {
    nameExtension: '_cnct',
    measurementType: 'contact',
  },
  ZHASwitch: {
    nameExtension: '_sw',
    measurementType: 'switch',
  },
  ZHAAirQuality: {
    nameExtension: '_airq',
    measurementType: 'air-quality',
  },
}

export const ACTUATOR_TYPE_MAPPERS: Record<
  PhosconActuatorCommandTypeEnum,
  { nameExtension: string; measurementType: MeasurementTypeEnum; commandType: ActuatorTypeEnum }
> = {
  'On/Off plug-in unit': {
    measurementType: 'on-off',
    commandType: 'relay',
    nameExtension: '_relay',
  },
  'Range extender': {
    measurementType: 'on-off',
    commandType: 'relay',
    nameExtension: '_unused',
  },
  'Color temperature light': {
    measurementType: 'illuminance', //TODO moet een nieuw sensor type worden !
    commandType: 'colored-light',
    nameExtension: '_clgt',
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
