import { NestFactory } from '@nestjs/core'
import { OpenhabInterfaceModule } from './openhab-interface.module'
import { CoreService } from '@core/core.service'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(OpenhabInterfaceModule)
  const cs = app.get(CoreService)
  const config = app.get(ConfigService)
  cs.test(config.get<string>('test'))
  await app.listen(3000)
}
bootstrap()
