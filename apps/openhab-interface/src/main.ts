import { NestFactory } from '@nestjs/core';
import { OpenhabInterfaceModule } from './openhab-interface.module';

async function bootstrap() {
  const app = await NestFactory.create(OpenhabInterfaceModule);
  await app.listen(3000);
}
bootstrap();
