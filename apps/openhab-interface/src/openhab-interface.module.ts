import { Module } from '@nestjs/common'
import { CoreService } from '@core/core.service'
import { OpenhabInterfaceController } from './openhab-interface.controller'
import { OpenhabInterfaceService } from './openhab-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import { CoreModule } from '@core'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  controllers: [OpenhabInterfaceController],
  providers: [OpenhabInterfaceService],
})
export class OpenhabInterfaceModule {}
