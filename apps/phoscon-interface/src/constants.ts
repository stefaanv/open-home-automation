import { CommandTypeEnum } from '@core/command-types/command-type.enum'
import { MeasurementTypeEnum } from '@core/measurement-types/measurement-type.enum'
import {
  HumidityMqttData,
  IlluminanceMqttData,
  TemperatureMqttData,
} from '@core/sensor-reading-mqtt-data-types/numberic-mqtt-data.type'
import { OnOffMqttData } from '@core/sensor-reading-mqtt-data-types/on-off-mqtt-data.type'
import { OpenClosedMqttData } from '@core/sensor-reading-mqtt-data-types/open-close-mqtt-data.type'
import { PresenceMqttData } from '@core/sensor-reading-mqtt-data-types/presence-mqtt-data.type'
import {
  SensorReadingMqttDataBaseClass,
  SensorReadingValueBaseType,
} from '@core/sensor-reading-mqtt-data-types/sensor-reading.base.class'
import { SwitchMqttData } from '@core/sensor-reading-mqtt-data-types/switch-mqtt-data.type'
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
} from './phoscon-type'

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

export const SENSOR_TYPE_MAPPERS: Record<
  PhosconStateTypeName,
  {
    nameExtension: string
    measurementType: MeasurementTypeEnum
    transformer: (state: PhosconState) => SensorReadingValueBaseType
    mqttSensorReading: (name: string) => SensorReadingMqttDataBaseClass
  }
> = {
  ZHALightLevel: {
    nameExtension: '_lumi',
    measurementType: 'illuminance',
    transformer: state => state['lux'] as number,
    mqttSensorReading: name => new IlluminanceMqttData(name, 'phoscon'),
  },
  ZHAPresence: {
    nameExtension: '_pres',
    measurementType: 'presence',
    transformer: state => (state['presence'] ?? state['presence'].on ? 'present' : 'absent'),
    mqttSensorReading: name => new PresenceMqttData(name, 'phoscon'),
  },
  ZHATemperature: {
    nameExtension: '_temp',
    measurementType: 'temperature',
    transformer: state => (state['temperature'] as number) / 100,
    mqttSensorReading: name => new TemperatureMqttData(name, 'phoscon'),
  },
  ZHAHumidity: {
    nameExtension: '_humi',
    measurementType: 'humidity',
    transformer: state => (state as HumidityState).humidity / 100,
    mqttSensorReading: name => new HumidityMqttData(name, 'phoscon'),
  },
  ZHAOpenClose: {
    nameExtension: '_cnct',
    measurementType: 'contact',
    transformer: state => (state['open'] ? 'open' : 'closed'),
    mqttSensorReading: name => new OpenClosedMqttData(name, 'phoscon'),
  },
  ZHASwitch: {
    nameExtension: '_sw',
    measurementType: 'switch',
    transformer: state => (state['buttonevent'] === 1002 ? 'shortpress' : undefined),
    mqttSensorReading: name => new SwitchMqttData(name, 'phoscon'),
  },
  'On/Off plug-in unit': {
    nameExtension: '_cnct',
    measurementType: 'contact',
    transformer: state => (state['open'] ? 'on' : 'off'),
    mqttSensorReading: name => new OnOffMqttData(name, 'phoscon'),
  },
  ZHAAirQuality: {
    nameExtension: '_airq',
    measurementType: 'air-quality',
    transformer: state => (state as HumidityState).humidity / 100,
    mqttSensorReading: name => new HumidityMqttData(name, 'phoscon'),
  },
}

export const ACTUATOR_TYPE_MAPPERS: Record<string, [string, CommandTypeEnum]> = {
  'On/Off plug-in unit': ['_relay', 'on-off'],
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

export type ActuatorSwitchCommand = { switch: 'on' | 'off' }
