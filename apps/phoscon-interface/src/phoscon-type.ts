export type PhosconEvent = {
  e: string
  id: string
  r: string
  t: string
  attr: PhosconAttr | undefined
  config: PhosconAttr | undefined
  state: PhosconState | undefined
  uniqueid: string
}

export type PhosconSensorDiscoveryItem = {
  uid: number
  config: any
  ep: number
  etag: string
  lastseen: string
  manufacturername: string
  modelid: string
  name: string
  state: any
  swversion: string
  type: string
  uniqueid: string
}

export type PhosconActuatorType = ''
export type PhosconActuatorDiscoveryItem = {
  uid: number
  etag: string
  hascolor: boolean
  manufacturer: string
  modelid: string
  name: string
  pointsymbol: any
  state: any
  swversion: string
  type: PhosconActuatorType
  uniqueid: string
}

export type PhosconAttr = {
  id: string
  lastannounced: string | null // Date
  lastseen: string | null //Date
  manufacturername: string
  modelid: string
  name: string
  swversion: string
  type: string
  uniqueid: string
}

export type PhosconState =
  | PresenceState
  | LightLevelState
  | TemperatureState
  | HumidityState
  | OpenClosedState
  | SwitchState

export type BaseState = {
  lastupdated: string //date
}

export type PresenceState = {
  presence: boolean | undefined
  on: boolean | undefined
} & BaseState

export type SwitchState = {
  buttonevent: number
} & BaseState

export type LightLevelState = {
  dark: boolean
  daylight: boolean
  lightlevel: number
  lux: number
} & BaseState

export type TemperatureState = {
  temperature: number
} & BaseState

export type HumidityState = {
  humidity: number
} & BaseState

export type OpenClosedState = {
  open: boolean | undefined
  on: boolean | undefined
} & BaseState

export type OnOffState = {
  on: boolean | undefined
} & BaseState

export type PhosconReportedValue = string | number | boolean | undefined
