import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { ItemUpdate, OldState } from '@core/itemUpdate.type'
import { SwitchState } from '@core/types/SwitchState'
import { TemperatureState } from '@core/types/TemperatureState'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'

type OpenHabEvent = {
  topic: string
  payload: string
  type: string
}

type OpenHabPayload = {
  type: string
  value: string
  oldType: string
  oldValue: string
}

type Transformer<T> = (
  topic: string,
  ohPayload: OpenHabPayload,
  now: Date,
  oldStates: Record<string, ItemUpdate<any>>,
  customConfig: any,
) => ItemUpdate<T>

export type ItemMapper = {
  typeFilter: RegExp
  topicFilter: RegExp
  transformer: Transformer<any>
  customConfig: any
}

export type ItemMapperConfig = {
  typeFilter: string
  topicFilter: string
  transformer: string
  customConfig: any
}

function regexTest(s: string, r: RegExp) {
  return r.test(s)
}

function regexExtract(s: string, r: RegExp, groupName: string): string | undefined {
  const groups = r.exec(s).groups
  if (!groups) return undefined
  return groups[groupName]
}

@Injectable()
export class OpenhabInterfaceService {
  private readonly _topicFilter: RegExp
  private readonly _itemMappers: ItemMapper[]
  private readonly _oldStates: Record<string, ItemUpdate<any>>
  private _processingStarted = false

  constructor(
    private readonly _log: LoggingService,
    private readonly _mqttDriver: MqttDriver,
    private readonly _config: ConfigService,
  ) {
    this._log.setContext(OpenhabInterfaceService.name)
    this._topicFilter = new RegExp(this._config.get<string>('openhab.fromOpenhab.generalTopicFilter', ''))
    const eventUrl = this._config.get<string>('openhab.fromOpenhab.openhabEventsUrl', 'unknown url')
    const mappersConfig = this._config.get<ItemMapperConfig[]>('openhab.fromOpenhab.itemsMappers', [])
    this._itemMappers = mappersConfig.map(c => ({
      topicFilter: new RegExp(c.topicFilter),
      typeFilter: new RegExp(c.typeFilter),
      transformer: { temperature: TemperatureTransformer, switch: SwitchTransformer }[c.transformer],
      customConfig: c.customConfig,
    }))
    this._oldStates = {}

    // Setting up de SSE link to Openhab
    if (!eventUrl.startsWith('http')) this._log.warn(`Suspect event URL '${eventUrl}'`)
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.sseEventHandler(evt)
    es.onerror = error => this._log.error(JSON.stringify(error))

    this._mqttDriver.subscribe(
      (tUpd: ItemUpdate) => this.mqttCallback(tUpd),
      [
        /*'oha/#'*/
      ],
    )
  }

  // Openhab SSE link event handler
  private sseEventHandler(evt: MessageEvent<any>) {
    if (!this._processingStarted) {
      this._log.log(`processing of openHAB events started`)
      this._processingStarted = true
    }
    const now = new Date()
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    if (!regexTest(evtData.topic, this._topicFilter)) return // doesn't even pass the openHAB general topic filter
    const payload: OpenHabPayload = JSON.parse(evtData.payload)
    const openhabTopic = regexExtract(evtData.topic, this._topicFilter, 'topic')
    this._itemMappers.some(im => {
      if (regexTest(openhabTopic, im.topicFilter) && regexTest(payload.type, im.typeFilter)) {
        const update = im.transformer(openhabTopic, payload, now, this._oldStates, im.customConfig)
        const topicToUpdate = update.item
        this._mqttDriver.updateItem(update)
        this._oldStates[topicToUpdate] = update
        return true
      }
      return false
    })
  }

  private mqttCallback(t: ItemUpdate) {
    //TODO handle messages received from MQTT
  }
}

/*
vlg_bureau
{ type: 'OnOff', value: 'ON', oldType: 'OnOff', oldValue: 'OFF' }
vlg_bureau
{ type: 'OnOff', value: 'OFF', oldType: 'OnOff', oldValue: 'ON' }
*/
const SwitchTransformer: Transformer<SwitchState> = (
  topic: string,
  ohPayload: OpenHabPayload,
  now: Date,
  oldStates: Record<string, ItemUpdate<any>>,
  customConfig: any,
): ItemUpdate<SwitchState> => {
  const valueLc = ohPayload.value.toLocaleLowerCase()
  const value = (['on', 'off'].includes(valueLc) ? valueLc : undefined) as SwitchState

  const lastUpdate = oldStates[topic]
  const previousState: OldState<SwitchState> = {
    time: lastUpdate ? lastUpdate.time : now,
    state: lastUpdate ? lastUpdate.newState : undefined,
  }

  return {
    time: now,
    type: 'switch',
    item: topic,
    newState: value,
    previousState,
  }
}

/*
bureau_temp
{
  type: 'Quantity',
  value: '30.900000000000002 °C',
  oldType: 'Quantity',
  oldValue: '23.3 °C'
}
bureau_vocht
{ type: 'Quantity', value: '93', oldType: 'Quantity', oldValue: '25' }
garage_temp
{
  type: 'Quantity',
  value: '22.1 °C',
  oldType: 'Quantity',
  oldValue: '22.200000000000003 °C'
}
*/

const TemperatureTransformer: Transformer<TemperatureState> = (
  topic: string,
  ohPayload: OpenHabPayload,
  now: Date,
  oldStates: Record<string, ItemUpdate<any>>,
  customConfig: any,
): ItemUpdate<TemperatureState> => {
  let topicToUpdate = topic.includes(customConfig.humidityTopicFilter ?? '____')
    ? topic.replace(customConfig['humidityTopicFilter'], customConfig['replaceBy'])
    : topic

  const value = parseFloat(ohPayload.value)
  let lastUpdate = oldStates[topicToUpdate]
  const previousState: OldState<TemperatureState> = {
    time: lastUpdate ? lastUpdate.time : now,
    state: lastUpdate ? lastUpdate.newState : { temperature: undefined, humidity: undefined },
  }
  let newState = { ...previousState.state }

  if (topicToUpdate === topic) {
    newState.temperature = value
  } else {
    newState.humidity = value
  }

  return {
    time: now,
    type: 'temperature',
    item: topicToUpdate,
    newState,
    previousState,
  }
}
