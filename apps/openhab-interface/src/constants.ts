import { SensorTypeMapper } from '@core/channel-service/types'
import { OpenHAB_SensorForeignTypeEnum } from './types'

export const SENSOR_TYPE_MAPPERS: SensorTypeMapper<OpenHAB_SensorForeignTypeEnum> = {
  'Number:Temperature': {
    typeIndicator: 'temp',
    measurementType: 'temperature',
  },
  'Number:Humidity': {
    typeIndicator: 'humi',
    measurementType: 'humidity',
  },
  'Number:Dimensionless': {
    typeIndicator: 'ignore',
    measurementType: undefined,
  },
  Number: {
    typeIndicator: 'ignore',
    measurementType: undefined,
  },
  Switch: {
    typeIndicator: 'vlg',
    measurementType: 'on-off',
  },
  Contact: {
    typeIndicator: 'cnct',
    measurementType: 'contact',
  },
}
