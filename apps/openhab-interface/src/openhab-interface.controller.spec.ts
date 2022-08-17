import { Test, TestingModule } from '@nestjs/testing';
import { OpenhabInterfaceController } from './openhab-interface.controller';
import { OpenhabInterfaceService } from './openhab-interface.service';

describe('OpenhabInterfaceController', () => {
  let openhabInterfaceController: OpenhabInterfaceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OpenhabInterfaceController],
      providers: [OpenhabInterfaceService],
    }).compile();

    openhabInterfaceController = app.get<OpenhabInterfaceController>(OpenhabInterfaceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(openhabInterfaceController.getHello()).toBe('Hello World!');
    });
  });
});
