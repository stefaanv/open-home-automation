import { LoggingService } from '@core/logging.service'
import { MqttDriver } from '@core/mqtt.driver'
import { Injectable } from '@nestjs/common'
// import * as es from 'eventsource'

@Injectable()
export class OpenhabInterfaceService {
  constructor(private readonly log: LoggingService, private readonly mqttDriver: MqttDriver) {
    this.log.setContext(OpenhabInterfaceService.name)
    this.mqttDriver.setTopicUpdateCallback(console.log)
  }

  getHello(): string {
    return 'Hello World!'
  }
}
