import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as mqtt from 'async-mqtt'
import { LoggingService } from './logging.service'
import handlebars from 'handlebars'
import { SensorReading } from './sensor-reading.type'
import { Command } from '@core/commands/command.type'
import { SensorReadingValue } from './sensor-reading-values'
import { regexExtract } from './helpers/helpers'

export type CommandCallback = (actuatorName: string, command: Command) => void

@Injectable()
export class MqttDriver {
  private _mqttClient: mqtt.IMqttClient
  private _callback?: CommandCallback = undefined
  private readonly _topicPrefix: string
  private _outSensorReadingMqttTopicTemplate: HandlebarsTemplateDelegate
  private _actuatorNameExtractor: RegExp

  constructor(private readonly _log: LoggingService, private readonly _config: ConfigService) {
    this._log.setContext(MqttDriver.name)
    const brokerUrl = this._config.get<string>('mqtt.broker', 'mqtt://localhost')
    this._topicPrefix = this._config.get<string>('mqtt.topicPrefix', 'oha')
    this._actuatorNameExtractor = new RegExp(this._config.get<string>('mqtt.actuatorNameExtractor', ''))
    const topicTemplate = this._config.get<string>(
      'mqtt.measurementUpdateTemplate',
      '{{prefix}}/sensor-reading/{{sensorName}}',
    )
    this._outSensorReadingMqttTopicTemplate = handlebars.compile(topicTemplate)
    this._mqttClient = mqtt.connect(brokerUrl)
    this._mqttClient
      .on('connect', () => {
        this._log.debug(`MQTT connected to ${brokerUrl}`)
      })
      .on('error', () => {
        this._log.error(`Unable to connect to MQTT broker at ${brokerUrl}`)
        process.exit(-1)
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
    //TODO validate incoming commands
    let payload
    try {
      payload = JSON.parse(message.toString('utf-8'))
    } catch (error) {
      payload = message.toString('utf-8')
    }
    const actuatorName = regexExtract(topic, this._actuatorNameExtractor, 'actuatorName')
    if (!actuatorName) throw new Error('Foutje')
    // this._log.debug(`received from ${topic} ${JSON.stringify(payload)}`)

    if (this._callback) this._callback(actuatorName, payload)
  }

  public sendSensorStateUpdate(topicInfix: string, update: SensorReading) {
    if (this._outSensorReadingMqttTopicTemplate) {
      const mqttTopic = this._outSensorReadingMqttTopicTemplate({ sensorName: topicInfix, prefix: this._topicPrefix })
      const stringified = JSON.stringify(update)
      this._log.debug(`sending update to ${mqttTopic}: ${stringified}`)

      this._mqttClient.publish(mqttTopic, stringified)
    }
  }
}
