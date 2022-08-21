export type ItemUpdate {
  time: Date
  itemName: string
}

export type TemperatureItemUpdate = {
  temperature: number
  humidity: number | undefined
} & ItemUpdate

export type SwitchStatus = 'on' | 'off' | 'open' | 'closed' | 'unknown'
export type SwitchItemUpdate = {
  state: SwitchStatus
} & ItemUpdate
