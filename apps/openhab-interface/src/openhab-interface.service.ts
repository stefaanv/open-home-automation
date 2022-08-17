import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenhabInterfaceService {
  getHello(): string {
    return 'Hello World!';
  }
}
