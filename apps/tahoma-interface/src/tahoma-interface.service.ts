import { Injectable } from '@nestjs/common';

@Injectable()
export class TahomaInterfaceService {
  getHello(): string {
    return 'Hello World!';
  }
}
