//@ts-ignore ts1219
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name)
  constructor() {}

  test(msg: string) {
    this.logger.log(msg)
  }
}
