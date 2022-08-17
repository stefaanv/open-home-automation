import { Module } from '@nestjs/common'
import { CoreService } from '@core/core.service'
import { OpenhabInterfaceController } from './openhab-interface.controller'
import { OpenhabInterfaceService } from './openhab-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  controllers: [OpenhabInterfaceController],
  providers: [OpenhabInterfaceService, CoreService],
})
export class OpenhabInterfaceModule {}
