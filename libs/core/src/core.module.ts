import { Module, Scope } from '@nestjs/common'
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
  providers: [{ provide: LoggingService, useClass: LoggingService, scope: Scope.TRANSIENT }, MqttDriver],
  exports: [MqttDriver, LoggingService],
})
export class CoreModule {}
