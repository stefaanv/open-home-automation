import { SwitchItemUpdate, SwitchStatus, TemperatureItemUpdate } from '@core/itemUpdates.type'

type OpenhabValueType = { value: string }

export function temperatureTransformer(time: Date, itemName: string, payload: OpenhabValueType): TemperatureItemUpdate {
  return {
    time,
    itemName,
    temperature: parseFloat(payload.value),
    humidity: undefined,
  }
}

export function switchTransformer(time: Date, itemName: string, payload: OpenhabValueType): SwitchItemUpdate {
  const ohState = payload.value.toLowerCase()
  const state = ['on', 'off', 'open', 'closed'].includes(ohState) ? (ohState as SwitchStatus) : 'unknown'
  return {
    time,
    itemName,
    state,
  }
}
