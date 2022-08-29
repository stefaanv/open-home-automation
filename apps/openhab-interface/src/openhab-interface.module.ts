import { Module } from '@nestjs/common'
import { OpenhabInterfaceService } from './openhab-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import { CoreModule } from '@core/core.module'

export const APP_NAME = 'openhab-interface'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [OpenhabInterfaceService],
})
export class OpenhabInterfaceModule {}
