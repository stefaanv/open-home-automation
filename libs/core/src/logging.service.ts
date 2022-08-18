//@ts-ignore ts1219
import { Injectable, Inject, Logger } from '@nestjs/common'
import { LoggingServiceInterface } from './logging.interface'

@Injectable()
export class LoggingService implements LoggingServiceInterface {
  private _logger = new Logger('no context')
  constructor() {}

  setContext(value: string) {
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

  debug(msg: string) {
    this._logger.debug(msg)
  }

  verbose(msg: string) {
    this._logger.verbose(msg)
  }
}
