export type Numeric = {
  type: 'numeric'
  value: number
  unit: string
  formattedValue: string
}

export type OnOff = ('on' | 'off' | undefined) & { type: 'on-off' }
export type OpenClosed = ('open' | 'closed' | undefined) & { type: 'open-closed' }
export type Presence = ('present' | 'absent' | undefined) & { type: 'presence' }
export type SwitchPressed = {
  type: 'switch-pressed'
  state: 'closed' | 'released' | 'shortpress' | 'longpress' | undefined
  pressDuration: number | undefined
}
