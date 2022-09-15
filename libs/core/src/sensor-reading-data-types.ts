import { NumericMeasurementTypeEnum } from './measurement-type.enum'

export type SensorReadingValue = Numeric | OnOff | OpenClosed | Presence | SwitchPressed | Moving

export type Numeric<T = NumericMeasurementTypeEnum> = {
  value: number
  unit: string
  formattedValue: string
  type: T
}

export type OnOff = 'on' | 'off' | undefined
export type Moving = boolean
export type OpenClosed = 'open' | 'closed' | undefined
export type Presence = 'present' | 'absent' | undefined
export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
