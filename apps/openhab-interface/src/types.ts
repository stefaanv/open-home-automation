export const OpenHAB_SensorTypeEnumNames = [
  'Number:Temperature',
  'Number:Humidity',
  'Number:Dimensionless',
  'Number',
  'Contact',
  'Switch',
] as const
export type OpenHAB_SensorForeignTypeEnum = typeof OpenHAB_SensorTypeEnumNames[number]

export type OpenHAB_SensorDiscoveryItem = {
  link: string
  state: OpenHAB_State
  editable: boolean
  name: string
  label: string
  tage: string[]
  groupNames: string[]
  type: OpenHAB_SensorForeignTypeEnum
}

export type OpenHAB_State = OpenHAB_ContactState | OpenHAB_NumericState

export type OpenHAB_ContactState = 'OPEN' | 'CLOSED' | 'NULL'
export type OpenHAB_NumericState = string
