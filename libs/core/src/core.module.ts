import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingService } from './logging.service'
import { MqttDriver } from './mqtt.driver'
import configuration from '@core/configuration'

export const INTERFACE_NAME_TOKEN = 'INTERFACE_NAME'
export const SENSOR_TYPE_MAPPERS_TOKEN = 'SENSOR_TRANSFORMERS'
export const ACTUATOR_TYPE_MAPPERS_TOKEN = 'ACTUATOR_TRANSFORMERS'

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
