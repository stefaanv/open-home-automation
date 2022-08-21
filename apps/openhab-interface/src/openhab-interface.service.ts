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

    // Setting up de SSE link to Openhab
    const es = new EventSource(eventUrl)
    es.onmessage = (evt: MessageEvent<any>) => this.eventHandler(evt)
  }

  // Openhab SSE link event handler
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
