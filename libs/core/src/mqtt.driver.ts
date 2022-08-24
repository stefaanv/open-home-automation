import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as mqtt from 'async-mqtt'
import { LoggingService } from './logging.service'
import handlebars from 'handlebars'
import { SensorReading } from './sensor-reading.type'

export type SensorReadingCallback = (t: SensorReading) => void

@Injectable()
export class MqttDriver {
  private _mqttClient: mqtt.IMqttClient
  private _callback?: SensorReadingCallback = undefined
  private readonly _topicPrefix: string
  private _outSensorReadingMqttTopicTemplate: HandlebarsTemplateDelegate = undefined

  constructor(private readonly _log: LoggingService, private readonly _config: ConfigService) {
    this._log.setContext(MqttDriver.name)
    const brokerUrl = this._config.get<string>('mqtt.broker', 'mqtt://192.168.0.10')
    this._topicPrefix = this._config.get<string>('mqtt.topicPrefix', 'oha')
    const topicTemplate = this._config.get<string>(
      'mqtt.measurementUpdateTemplate',
      '{{prefix}}/sensor-reading/{{sensorName}}',
    )
    this._outSensorReadingMqttTopicTemplate = handlebars.compile(topicTemplate)
    this._mqttClient = mqtt.connect(brokerUrl)
    this._mqttClient.on('connect', () => {
      this._log.debug(`MQTT connected to ${brokerUrl}`)
    })
    this._mqttClient.on('message', (topic: string, message: Buffer) => this.mqttReceived(topic, message))
  }

  get connected() {
    return this._mqttClient.connected
  }

  public subscribe(callback: SensorReadingCallback, subscribeTo: string[] = []) {
    subscribeTo.forEach(s => {
      this._mqttClient.subscribe(s)
      this._log.debug(`MQTT subscribed to ${s}`)
    })

    this._callback = callback
    this._log.debug(`MQTT callback set`)
  }

  private mqttReceived(topic: string, message: Buffer) {
    const payload: SensorReading = JSON.parse(message.toString('utf-8'))
    payload.name = topic.replace(this._topicPrefix + '/', '')
    this._log.debug(`received from ${topic} ${JSON.stringify(payload)}`)

    if (this._callback) this._callback(payload)
  }

  public sendMeasurement(update: SensorReading) {
    if (this._outSensorReadingMqttTopicTemplate) {
      const mqttTopic = this._outSensorReadingMqttTopicTemplate({ sensorName: update.name, prefix: this._topicPrefix })
      this._log.debug(`sending update to ${mqttTopic}`)
      this._mqttClient.publish(mqttTopic, JSON.stringify(update))
    }
  }
}
