import { Module } from '@nestjs/common'
import { PhosconInterfaceService } from './phoscon-interface.service'
import { ConfigModule } from '@nestjs/config'
import configuration from '@core/configuration'
import {
  ACTUATOR_TYPE_MAPPERS_TOKEN,
  CoreModule,
  INTERFACE_NAME_TOKEN,
  SENSOR_TYPE_MAPPERS_TOKEN,
} from '@core/core.module'
import { InterfaceBase } from '@core/channel-service/interface-base.service'
import { ACTUATOR_TYPE_MAPPERS, SENSOR_TYPE_MAPPERS } from './constants'

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
    { provide: SENSOR_TYPE_MAPPERS_TOKEN, useValue: SENSOR_TYPE_MAPPERS },
    { provide: ACTUATOR_TYPE_MAPPERS_TOKEN, useValue: ACTUATOR_TYPE_MAPPERS },
  ],
})
export class PhosconInterfaceModule {}
