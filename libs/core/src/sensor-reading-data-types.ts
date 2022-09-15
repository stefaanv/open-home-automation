import { NumericMeasurementTypeEnum } from './measurement-type.enum'

export type SensorReadingValue = Numeric | OnOff | OpenClosed | Presence | SwitchPressed | Moving

export type Numeric<T = NumericMeasurementTypeEnum> = {
  value: number
  unit: string
  formattedValue: string
  type: T
}

export type OnOff = ('on' | 'off' | undefined) & { type: 'on-off' }
export type Moving = boolean & { type: 'moving' }
export type OpenClosed = ('open' | 'closed' | undefined) & { type: 'open-closed' }
export type Presence = ('present' | 'absent' | undefined) & { type: 'presence' }
export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
} & { type: 'switch' }
