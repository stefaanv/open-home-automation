import nextAvailablePort from '@core/helpers/port-available'
import { LoggingService } from '@core/logging.service'
import { NestFactory } from '@nestjs/core'
import { PhosconInterfaceModule } from './phoscon-interface.module'
import { APP_NAME } from './phoscon-interface.module'

async function bootstrap() {
  const app = await NestFactory.create(PhosconInterfaceModule)
  const logger = app.get(LoggingService)
  const port = await nextAvailablePort()
  logger.setContext('main')
  logger.log(`${APP_NAME} is listening on port ${port}`)
  await app.listen(port)
}
bootstrap()
