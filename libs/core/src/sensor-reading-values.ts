import { MeasurementTypeEnum, NumericMeasurementTypeEnum } from './measurement-type.enum'

export type SensorReadingValue = Numeric | OnOff | OpenClosed | Presence | SwitchPressed | Moving | ColoredLight
export type SensorReadingValueWithoutType = Omit<SensorReadingValue, 'type'> & { type?: MeasurementTypeEnum }
export type TimedSensorReadingValue = {
  value: SensorReadingValue
  time: Date
}

export type NamedTimedSensorReadingValue = TimedSensorReadingValue & { name: string }

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
  type: 'switch'
}
export type ColoredLight = {
  brightness: number
  colorTemperature: number
  on: boolean
  reachable: boolean
  alert: string
  type: 'colored-light'
}
