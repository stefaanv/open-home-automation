import { MeasurementType } from './measurement-types/measurement-type.type'

export type SensorReading<T extends string | number | boolean> = {
  origin: string
  time: Date
  type: MeasurementType
  name: string
  value: T
  unit: string
  formattedValue: string
}
