import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as mqtt from 'async-mqtt'
import { LoggingService } from './logging.service'
import handlebars from 'handlebars'
import { SensorReading } from './sensor-reading.type'
import { Command, MqttCommandPacket } from '@core/commands/actuator-command.type'
import { SensorReadingValue } from './sensor-reading-data-types'

export type CommandCallback = (actuatorName: string, command: Command) => void

@Injectable()
export class MqttDriver {
  private _mqttClient: mqtt.IMqttClient
  private _callback?: CommandCallback = undefined
  private readonly _topicPrefix: string
  private _outSensorReadingMqttTopicTemplate: HandlebarsTemplateDelegate = undefined
  private _actuatorNameExtractor: RegExp

  constructor(private readonly _log: LoggingService, private readonly _config: ConfigService) {
    this._log.setContext(MqttDriver.name)
    const brokerUrl = this._config.get<string>('mqtt.broker', 'mqtt://192.168.0.10')
    this._topicPrefix = this._config.get<string>('mqtt.topicPrefix', 'oha')
    this._actuatorNameExtractor = new RegExp(this._config.get<string>('mqtt.actuatorNameExtractor', ''))
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

  public subscribe(callback: CommandCallback, subscribeTo: string[] = []) {
    subscribeTo.forEach(s => {
      this._mqttClient.subscribe(s)
      this._log.debug(`MQTT subscribed to ${s}`)
    })

    this._callback = callback
    this._log.debug(`MQTT callback set`)
  }

  private mqttReceived(topic: string, message: Buffer) {
    const payload: MqttCommandPacket = JSON.parse(message.toString('utf-8'))
    const actuatorName = this._actuatorNameExtractor.exec(topic).groups['actuatorName']
    // this._log.debug(`received from ${topic} ${JSON.stringify(payload)}`)

    if (this._callback) this._callback(actuatorName, payload.command)
  }

  public sendMeasurement(update: SensorReading<SensorReadingValue>) {
    if (this._outSensorReadingMqttTopicTemplate) {
      const mqttTopic = this._outSensorReadingMqttTopicTemplate({ sensorName: update.name, prefix: this._topicPrefix })
      // this._log.debug(`sending update to ${mqttTopic}`)
      this._mqttClient.publish(mqttTopic, JSON.stringify(update))
    }
  }
}
