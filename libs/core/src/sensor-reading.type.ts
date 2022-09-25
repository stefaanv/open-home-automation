import { MeasurementTypeEnum } from './measurement-type.enum'
import { SensorReadingValue } from './sensor-reading-data-types'

export type SensorReading<TValue extends SensorReadingValue = SensorReadingValue> = {
  origin: string
  time: Date
  type: MeasurementTypeEnum
  value: TValue
}
