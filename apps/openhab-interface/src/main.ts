import { NestFactory } from '@nestjs/core'
import { OpenhabInterfaceModule } from './openhab-interface.module'
import { OpenhabInterfaceService } from './openhab-interface.service'
//TODO remove comments
// import { CoreService } from '@core/core.service'
// import { ConfigService } from '@nestjs/config'
// import { LoggingService } from '@core/logging.service'

async function bootstrap() {
  const app = await NestFactory.create(OpenhabInterfaceModule)
  // const cs = app.get(CoreService)
  // const config = app.get(ConfigService)
  // const logger = app.get(LoggingService)
  // logger.setContext('main')
  // logger.error('error')
  // cs.test(config.get<string>('test'))
  // const oh = app.get(OpenhabInterfaceService)
  await app.listen(3002)
}
bootstrap()
