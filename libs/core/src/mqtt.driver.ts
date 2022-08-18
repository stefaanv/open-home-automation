import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as mqtt from 'async-mqtt'
import { LoggingService } from './logging.service'

export type TopicType = 'temperature' | 'somethingElse'

export type TopicUpdate = {
  topic: string
  type: TopicType
  time: Date
} & Record<string, any>

export type TopicUpdateCallback = (t: TopicUpdate) => void

@Injectable()
export class MqttDriver {
  private _mqttClient: mqtt.IMqttClient
  private _callback?: TopicUpdateCallback = undefined
  private readonly _topicPrefix: string

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

  setTopicUpdateCallback(callback: TopicUpdateCallback) {
    this._callback = callback
    this.log.debug(`MQTT callback set`)
  }

  private mqttReceived(topic: string, message: Buffer) {
    const payload: TopicUpdate = JSON.parse(message.toString('utf-8'))
    payload.topic = topic.replace(this._topicPrefix + '/', '')
    if (this._callback) this._callback(payload)
  }
}
