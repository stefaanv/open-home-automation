import { Module } from '@nestjs/common';
import { OpenhabInterfaceController } from './openhab-interface.controller';
import { OpenhabInterfaceService } from './openhab-interface.service';

@Module({
  imports: [],
  controllers: [OpenhabInterfaceController],
  providers: [OpenhabInterfaceService],
})
export class OpenhabInterfaceModule {}
