import { Controller, Get } from '@nestjs/common'
import { PhosconInterfaceService } from './phoscon-interface.service'

@Controller()
export class PhosconInterfaceController {
  constructor(private readonly phosconInterfaceService: PhosconInterfaceService) {}

  @Get()
  getHello(): string {
    return ''
  }
}
