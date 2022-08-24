import { Module } from '@nestjs/common'
import { PhosconInterfaceService } from './phoscon-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import { CoreModule } from '@core/core.module'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [PhosconInterfaceService],
})
export class PhosconInterfaceModule {}