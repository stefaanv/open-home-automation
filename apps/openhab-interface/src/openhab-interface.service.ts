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

@Injectable()
export class OpenhabInterfaceService {
  private readonly _generalTopicFilter: RegExp
  private readonly _items: ItemConfig[]

  constructor(
    private readonly log: LoggingService,
    private readonly mqttDriver: MqttDriver,
    private readonly config: ConfigService,
  ) {
    this.log.setContext(OpenhabInterfaceService.name)
    this.mqttDriver.setTopicUpdateCallback(console.log) //TODO aan te passen - voor commando's naar openHAB
    const eventUrl = this.config.get<string>('openhab.eventsUrl', '') // http api SSE eindpunt van openhab
    const itemsConfig = this.config.get<ItemConfig[]>('openhab.items', []) // items vertaling definitie

    // omvormen van de configuratie naar objecten
    this._items = itemsConfig.map<ItemConfig>(ic => ({
      topicFilter: new RegExp(ic.topicFilter),
      typeFilter: new RegExp(ic.typeFilter),
      transform: null,
    }))

    // Setting up de SSE link to Openhab
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.eventHandler(evt)
  }

  // Openhab SSE link event handler
  private eventHandler(evt: MessageEvent<any>) {
    const evtData: OpenHabEvent = JSON.parse(evt.data)
    if (this._generalTopicFilter.test) {
      const gtfResult = this._generalTopicFilter.exec(evtData.topic)
      const openHabTopic = gtfResult.groups.topic
      console.log(`extracted openhab topic = '${openHabTopic}'`)

      this._items.forEach(item => {
        if (item.topicFilter.test(evtData.topic) && item.typeFilter.test(evtData.type)) {
          const topicFilterResult = item.topicFilter.exec(openHabTopic)
          const translatedTopic = topicFilterResult.groups.topic
          console.log(`translatedTopic = '${translatedTopic}'`)
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
}
