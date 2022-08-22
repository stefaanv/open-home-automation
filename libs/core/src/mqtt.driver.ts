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
  private _outMqttTopicTemplate: HandlebarsTemplateDelegate = undefined

  constructor(private readonly log: LoggingService, private readonly config: ConfigService) {
    this.log.setContext(MqttDriver.name)
    const brokerUrl = config.get<string>('mqtt.broker', '')
    this._topicPrefix = config.get<string>('mqtt.topicPrefix', 'openHomeAutomation')
    this._mqttClient = mqtt.connect(brokerUrl)
    this._mqttClient.on('connect', () => {
      this.log.debug(`MQTT connected to ${brokerUrl}`)
      this._mqttClient.subscribe(this._topicPrefix + '/#', (err, granted) => console.log(granted))
      this.log.debug(`MQTT subscribed to ${this._topicPrefix + '/#'}`)
    })
    this._mqttClient.on('message', (topic: string, message: Buffer) => this.mqttReceived(topic, message))
  }

  get connected() {
    return this._mqttClient.connected
  }

  set outMqttTopicTemplate(value: string) {
    this._outMqttTopicTemplate = handlebars.compile(value)
  }

  public setTopicUpdateCallback(callback: ItemUpdateCallback) {
    //TODO still need to subscribe to the mqtt topic(s) !
    this._callback = callback
    this.log.debug(`MQTT callback set`)
  }

  private mqttReceived(topic: string, message: Buffer) {
    const payload: ItemUpdate = JSON.parse(message.toString('utf-8'))
    payload.item = topic.replace(this._topicPrefix + '/', '')
    if (this._callback) this._callback(payload)
  }

  public send(update: ItemUpdate) {
    if (this._outMqttTopicTemplate) {
      const mqttTopic = this._outMqttTopicTemplate({ topic: update.item })
      this._mqttClient.publish(mqttTopic, JSON.stringify(update))
    }
  }
}
