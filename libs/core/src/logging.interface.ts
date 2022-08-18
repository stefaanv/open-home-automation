//@ts-ignore ts1219
import { Injectable, Inject, Logger } from '@nestjs/common'

export interface LoggingServiceInterface {
  setContext(value: string): void
  log(msg: string): void
  warn(msg: string): void
  error(msg: string): void
  debug(msg: string): void
  verbose(msg: string): void
}
