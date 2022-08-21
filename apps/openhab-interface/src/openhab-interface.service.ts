import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'
import { SwitchTransformer } from './switch-transformer'
import { TemperatureTransformer } from './temperature-transformer'
import { TransformerInterface } from './transformer.interface'

export type ItemMapper = {
  typeFilter: RegExp
  transformer: TransformerInterface
}

export type ItemMapperConfig = {
  typeFilter: string
  transformer: string
}

type OpenHabEvent = {
  topic: string
  payload: string
  type: string
}

/*
const tempTransformer = (time: Date, payload: { value: string }) => ({
  time,
  temperature: parseFloat(payload.value).toFixed(1),
})

const humidityTransformer = (time: Date, payload: { value: string }) => ({
  time,
  humidity: parseInt(payload.value),
})

const switchTransformer = (time: Date, payload: { value: string }) => ({
  time,
  state: payload.value.toLowerCase(),
})
*/

@Injectable()
export class OpenhabInterfaceService {
  private readonly _topicFilter: RegExp
  private readonly _items: ItemMapper[]

  constructor(
    private readonly log: LoggingService,
    private readonly mqttDriver: MqttDriver,
    private readonly config: ConfigService,
  ) {
    this.log.setContext(OpenhabInterfaceService.name)
    this.mqttDriver.setTopicUpdateCallback(console.log)
    this._topicFilter = new RegExp(this.config.get<string>('openhab.generalTopicFilter', ''))
    const eventUrl = this.config.get<string>('openhab.eventsUrl', '')
    const itemsConfig = this.config.get<ItemMapperConfig[]>('openhab.itemsMappers', [])
    this._items = itemsConfig.map<ItemMapper>(imc => {
      const transformer = {
        TemperatureTransformer: new TemperatureTransformer(imc),
        SwitchTransformer: new SwitchTransformer(imc),
      }[imc.transformer]
      return {
        typeFilter: new RegExp(imc.typeFilter),
        transformer,
      }
    })

    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.eventHandler(evt)
    this.log.log(`constructor finished`)
  }

  private eventHandler(evt: MessageEvent<any>) {
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    if (!this._topicFilter.test(evtData.topic)) return // doesn't even pass the openHAB general topic filter
    const topicFilterResult = this._topicFilter.exec(evtData.topic)
    const openhabTopic = topicFilterResult.groups?.topic
    if (!openhabTopic) return // unable to extract
    this._items.forEach(item => {
      console.log(evtData)
      console.log(openhabTopic)
    })
    if (evtData.type === 'ItemStateChangedEvent') {
      const payload = JSON.parse(evtData.payload)
    }
  }
}
