import { Controller, Get } from '@nestjs/common';
import { OpenhabInterfaceService } from './openhab-interface.service';

@Controller()
export class OpenhabInterfaceController {
  constructor(private readonly openhabInterfaceService: OpenhabInterfaceService) {}

  @Get()
  getHello(): string {
    return this.openhabInterfaceService.getHello();
  }
}
