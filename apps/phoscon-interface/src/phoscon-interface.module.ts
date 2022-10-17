import { Module, Scope } from '@nestjs/common'
import { PhosconInterfaceService } from './phoscon-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import { CoreModule, INTERFACE_NAME_TOKEN } from '@core/core.module'
import { LoggingService } from '@core/logging.service'

const INTERFACE_NAME = 'phoscon'

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
  providers: [
    PhosconInterfaceService,
    { provide: INTERFACE_NAME_TOKEN, useValue: INTERFACE_NAME },
    { provide: LoggingService, useClass: LoggingService, scope: Scope.TRANSIENT },
  ],
})
export class PhosconInterfaceModule {}
