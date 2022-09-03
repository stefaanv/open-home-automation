import { MeasurementType } from './measurement-types/measurement-type.type'
import { SensorReadingValueBaseType } from './sensor-reading-mqtt-data-types/sensor-reading.base.class'

export type SensorReading<T extends SensorReadingValueBaseType> = {
  origin: string
  time: Date
  type: MeasurementType
  name: string
  value: T
  unit: string
  formattedValue: string
}
