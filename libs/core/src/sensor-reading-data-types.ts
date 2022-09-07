import { NumericTypeEnum } from './measurement-type.enum'

export type SensorReadingValue = Numeric | OnOff | OpenClosed | Presence | SwitchPressed

export type Numeric = {
  value: number
  unit: string
  formattedValue: string
}

export type OnOff = 'on' | 'off' | undefined
export type OpenClosed = 'open' | 'closed' | undefined
export type Presence = 'present' | 'absent' | undefined
export type SwitchPressed = {
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
