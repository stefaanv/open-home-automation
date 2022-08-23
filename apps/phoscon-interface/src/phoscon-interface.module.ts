import { Module } from '@nestjs/common';
import { PhosconInterfaceController } from './phoscon-interface.controller';
import { PhosconInterfaceService } from './phoscon-interface.service';

@Module({
  imports: [],
  controllers: [PhosconInterfaceController],
  providers: [PhosconInterfaceService],
})
export class PhosconInterfaceModule {}
