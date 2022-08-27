import { NestFactory } from '@nestjs/core'
import { PhosconInterfaceModule } from './phoscon-interface.module'

async function bootstrap() {
  const app = await NestFactory.create(PhosconInterfaceModule)
  await app.listen(3001)
}
bootstrap()
