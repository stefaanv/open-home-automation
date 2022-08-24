export type SensorReadingType = 'temperature' | 'switch' | 'somethingElse'

export type SensorReading<T = any> = {
  time: Date
  type: SensorReadingType
  name: string
  measurement: T
  previousMeasurement: undefined | PreviousMeasurement<T>
}

export interface PreviousMeasurement<T = any> {
  time: Date
  measurement: T
}
