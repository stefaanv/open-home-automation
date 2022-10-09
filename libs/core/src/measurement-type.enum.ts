export type MeasurementTypeEnum =
  | undefined
  | NumericMeasurementTypeEnum
  | ('switch' | 'on-off' | 'contact' | 'presence' | 'air-quality' | 'moving' | 'open-closed' | 'colored-light')

export type NumericMeasurementTypeEnum = 'temperature' | 'humidity' | 'illuminance' | 'closure'
