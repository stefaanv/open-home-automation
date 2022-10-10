import { ActuatorTypeMapper, SensorTypeMapper } from '@core/channel-service/types'
import { ActuatorTypeEnum } from '@core/commands/actuator-type.enum'
import { PhosconActuatorTypeEnum, PhosconForeignTypeEnum } from './types'

export const SENSOR_TYPE_MAPPERS: SensorTypeMapper<PhosconForeignTypeEnum> = {
  ZHALightLevel: 'illuminance',
  ZHAPresence: 'presence',
  ZHATemperature: 'temperature',
  ZHAHumidity: 'humidity',
  ZHAOpenClose: 'contact',
  ZHASwitch: 'switch',
  ZHAAirQuality: 'air-quality',
  'Color temperature light': 'colored-light',
  'On/Off plug-in unit': 'on-off',
  'Range extender': undefined,
}

export const ACTUATOR_TYPE_MAPPERS: ActuatorTypeMapper<PhosconActuatorTypeEnum> = {
  'On/Off plug-in unit': 'relay',
  'Range extender': undefined,
  'Color temperature light': 'colored-light',
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
