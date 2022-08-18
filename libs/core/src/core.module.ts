import { Module } from '@nestjs/common'
import { CoreService } from './core.service'
import { LoggingService } from './logging.service'

@Module({
  providers: [CoreService, LoggingService],
  exports: [CoreService, LoggingService],
})
export class CoreModule {}
