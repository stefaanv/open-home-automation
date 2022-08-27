export type MeasurementType =
  | 'temperature'
  | 'humidity'
  | 'switch'
  | 'on-off'
  | 'contact'
  | 'luminance'
  | 'presence'
  | 'air-quality'

export type SensorReading<T = any> = {
  origin: string
  time: Date
  type: MeasurementType
  name: string
  value: T
  unit: string
  formattedValue: string
}
