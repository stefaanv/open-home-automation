import { MeasurementTypeEnum } from './measurement-types/measurement-type.enum'
import { SensorReadingValueBaseType } from './sensor-reading-mqtt-data-types/sensor-reading.base.class'

export type SensorReading<T extends SensorReadingValueBaseType> = {
  origin: string
  time: Date
  type: MeasurementTypeEnum
  name: string
  value: T
  unit: string
  formattedValue: string
}
