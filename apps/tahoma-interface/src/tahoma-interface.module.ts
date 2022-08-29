import { CoreModule } from '@core/core.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TahomaInterfaceService } from './tahoma-interface.service'
import configuration from '@core/configuration'

export const APP_NAME = 'tahoma-interface'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [TahomaInterfaceService],
})
export class TahomaInterfaceModule {}
