//@ts-ignore ts1219
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name)
  constructor() {}

  test(msg: string) {
    this.logger.log(msg)
  }
}
