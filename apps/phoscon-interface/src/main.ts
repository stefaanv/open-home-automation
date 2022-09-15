import { ActuatorChannelList } from '@core/channels/actuator-channel-list.class'
import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { SensorChannelList } from '@core/channels/sensor-channel-list.class'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import { INTERFACE_NAME_TOKEN } from '@core/core.module'
import nextAvailablePort from '@core/helpers/port-available'
import { LoggingService } from '@core/logging.service'
import { NestFactory } from '@nestjs/core'
import { PhosconInterfaceModule } from './phoscon-interface.module'

async function bootstrap() {
  const app = await NestFactory.create(PhosconInterfaceModule)
  const logger = app.get(LoggingService)
  const interfaceName = app.get(INTERFACE_NAME_TOKEN)
  SensorChannel.log = logger
  ActuatorChannel.log = logger
  SensorChannelList.log = logger
  ActuatorChannelList.log = logger
  const port = await nextAvailablePort()
  logger.setContext('main')
  logger.log(`${interfaceName} is listening on port ${port}`)
  await app.listen(port)
}
bootstrap()
