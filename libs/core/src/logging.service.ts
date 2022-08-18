//@ts-ignore ts1219
import { Injectable, Inject, Logger } from '@nestjs/common'

@Injectable()
export class LoggingService {
  private _logger = new Logger('no context')
  constructor() {}

  set context(value: string) {
    this._logger = new Logger(value)
  }

  log(msg: string) {
    this._logger.log(msg)
  }

  warn(msg: string) {
    this._logger.warn(msg)
  }

  error(msg: string) {
    this._logger.error(msg)
  }
}
