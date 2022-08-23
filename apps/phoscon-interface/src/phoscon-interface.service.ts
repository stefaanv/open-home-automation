import { Injectable } from '@nestjs/common';

@Injectable()
export class PhosconInterfaceService {
  getHello(): string {
    return 'Hello World!';
  }
}
