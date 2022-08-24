export type MeasurementType = 'temperature' | 'humidity' | 'switch' | 'on-off' | 'luminance'

export type SensorReading<T = any> = {
  time: Date
  type: MeasurementType
  name: string
  measurement: T
  previousMeasurement: undefined | PreviousMeasurement<T>
}

export interface PreviousMeasurement<T = any> {
  time: Date
  measurement: T
}
