import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import EventSource from 'eventsource'

export type ItemConfig = {
  topicFilter: RegExp
  typeFilter: RegExp
  transform: (time: Date, payload: any) => any
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
  private readonly _items: ItemConfig[]

  constructor(
    private readonly log: LoggingService,
    private readonly mqttDriver: MqttDriver,
    private readonly config: ConfigService,
  ) {
    this.log.setContext(OpenhabInterfaceService.name)
    this.mqttDriver.setTopicUpdateCallback(console.log)
    const eventUrl = this.config.get<string>('openhab.eventsUrl', '')
    const itemsConfig = this.config.get<ItemConfig[]>('openhab.items', [])
    this._items = itemsConfig.map<ItemConfig>(ic => ({
      topicFilter: new RegExp(ic.topicFilter),
      typeFilter: new RegExp(ic.typeFilter),
      transform: null,
    }))

    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.eventHandler(evt)
    this.log.log(`constructor finished`)
  }

  private eventHandler(evt: MessageEvent<any>) {
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    this._items.forEach(item => {
      const topicFilterResult = item.topicFilter.exec(evtData.topic)
      const typeFilterResult = item.typeFilter.exec(evtData.type)
      if (item.topicFilter.test(evtData.topic) && item.typeFilter.test(evtData.type)) {
        console.log(evtData)
      }
    })
    if (evtData.type === 'ItemStateChangedEvent') {
      const payload = JSON.parse(evtData.payload)
      // if (itemConfig) {
      //   const now = new Date()
      //   const tranformedPayload = itemConfig.transform(now, payload)
      //   if (this.mqttClientConnected) {
      //     this.logger.log(`sending to "${itemConfig.mqttTopic}" -> ${JSON.stringify(tranformedPayload)}`)
      //     this.mqttClient.publish(itemConfig.mqttTopic, JSON.stringify(tranformedPayload))
      //   } else {
      //     this.logger.error(`Unable to sent ${JSON.stringify(tranformedPayload)} to ${itemConfig.mqttTopic}`)
      //   }
      // } else {
      //   this.logger.warn(`Unknown openHAB topic "${evtData.topic}" : ${JSON.stringify(payload)}`)
      // }
    }
  }
}
