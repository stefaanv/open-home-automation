import nextAvailablePort from '@core/helpers/port-available'
import { LoggingService } from '@core/logging.service'
import { NestFactory } from '@nestjs/core'
import { OpenhabInterfaceModule } from './openhab-interface.module'
import { APP_NAME } from './openhab-interface.module'
//TODO remove comments
// import { CoreService } from '@core/core.service'
// import { ConfigService } from '@nestjs/config'
// import { LoggingService } from '@core/logging.service'

async function bootstrap() {
  const app = await NestFactory.create(OpenhabInterfaceModule)
  // const cs = app.get(CoreService)
  // const config = app.get(ConfigService)
  const logger = app.get(LoggingService)
  const port = await nextAvailablePort()
  logger.setContext('main')
  logger.log(`${APP_NAME} is listening on port ${port}`)
  await app.listen(port)
}
bootstrap()
