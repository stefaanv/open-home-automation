import { ActuatorChannel } from '@core/channels/actuator-channel.class'
import { SensorChannel } from '@core/channels/sensor-channel.class'
import nextAvailablePort from '@core/helpers/port-available'
import { LoggingService } from '@core/logging.service'
import { NestFactory } from '@nestjs/core'
import { TahomaInterfaceModule } from './tahoma-interface.module'
import { APP_NAME } from './tahoma-interface.module'
// starten met `nest start tahoma-interface --debug`

async function bootstrap() {
  const app = await NestFactory.create(TahomaInterfaceModule)
  const logger = app.get(LoggingService)
  SensorChannel.log = logger
  ActuatorChannel.log = logger

  const port = await nextAvailablePort()
  logger.setContext('main')
  logger.log(`${APP_NAME} is listening on port ${port}`)
  await app.listen(port)
}
bootstrap()
