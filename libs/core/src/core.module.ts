import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingService } from './logging.service'
import { MqttDriver } from './mqtt.driver'
import configuration from '@core/configuration'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [LoggingService, MqttDriver],
  exports: [LoggingService, MqttDriver],
})
export class CoreModule {}
