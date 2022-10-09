import { MeasurementTypeEnum } from '@core/measurement-type.enum'
import { OpenHAB_SensorForeignTypeEnum } from './types'

export const SENSOR_TYPE_MAPPERS: Record<
  OpenHAB_SensorForeignTypeEnum,
  { nameExtension: string; measurementType: MeasurementTypeEnum }
> = {
  'Number:Temperature': {
    nameExtension: '_temp',
    measurementType: 'temperature',
  },
  'Number:Humidity': {
    nameExtension: '_humi',
    measurementType: 'humidity',
  },
  'Number:Dimensionless': {
    nameExtension: '_ignore',
    measurementType: undefined,
  },
  Number: {
    nameExtension: '_ignore',
    measurementType: undefined,
  },
  Switch: {
    nameExtension: '_vlg',
    measurementType: 'on-off',
  },
  Contact: {
    nameExtension: '_cnct',
    measurementType: 'contact',
  },
}
