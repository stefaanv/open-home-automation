import { Module } from '@nestjs/common'
import { OpenhabInterfaceService } from './openhab-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import { CoreModule, INTERFACE_NAME_TOKEN } from '@core/core.module'

export const APP_NAME = 'openhab-interface'

const INTERFACE_NAME = 'openhab'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    OpenhabInterfaceService,
    {
      provide: INTERFACE_NAME_TOKEN,
      useValue: INTERFACE_NAME,
    },
  ],
})
export class OpenhabInterfaceModule {}
