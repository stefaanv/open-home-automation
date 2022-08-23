import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as mqtt from 'async-mqtt'
import { LoggingService } from './logging.service'
import handlebars from 'handlebars'
import { ItemUpdate } from './itemUpdate.type'

export type ItemUpdateCallback = (t: ItemUpdate) => void

@Injectable()
export class MqttDriver {
  private _mqttClient: mqtt.IMqttClient
  private _callback?: ItemUpdateCallback = undefined
  private readonly _topicPrefix: string
  private _outItemUpdateMqttTopicTemplate: HandlebarsTemplateDelegate = undefined

  constructor(private readonly _log: LoggingService, private readonly _config: ConfigService) {
    this._log.setContext(MqttDriver.name)
    const brokerUrl = this._config.get<string>('mqtt.broker', 'mqtt://192.168.0.10')
    this._topicPrefix = this._config.get<string>('mqtt.topicPrefix', 'oha')
    const topicTemplate = this._config.get<string>('mqtt.itemUpdateTemplate', '{{prefix}}/itemUpdate/{{item}}')
    this._outItemUpdateMqttTopicTemplate = handlebars.compile(topicTemplate)
    this._mqttClient = mqtt.connect(brokerUrl)
    this._mqttClient.on('connect', () => {
      this._log.debug(`MQTT connected to ${brokerUrl}`)
    })
    this._mqttClient.on('message', (topic: string, message: Buffer) => this.mqttReceived(topic, message))
  }

  get connected() {
    return this._mqttClient.connected
  }

  public subscribe(callback: ItemUpdateCallback, subscribeTo: string[] = []) {
    subscribeTo.forEach(s => {
      this._mqttClient.subscribe(s)
      this._log.debug(`MQTT subscribed to ${s}`)
    })

    this._callback = callback
    this._log.debug(`MQTT callback set`)
  }

  private mqttReceived(topic: string, message: Buffer) {
    const payload: ItemUpdate = JSON.parse(message.toString('utf-8'))
    payload.item = topic.replace(this._topicPrefix + '/', '')
    this._log.debug(`received from ${topic} ${JSON.stringify(payload)}`)

    if (this._callback) this._callback(payload)
  }

  public updateItem(update: ItemUpdate) {
    if (this._outItemUpdateMqttTopicTemplate) {
      const mqttTopic = this._outItemUpdateMqttTopicTemplate({ item: update.item, prefix: this._topicPrefix })
      this._log.debug(`sending update to ${mqttTopic}`)
      this._mqttClient.publish(mqttTopic, JSON.stringify(update))
    }
  }
}
