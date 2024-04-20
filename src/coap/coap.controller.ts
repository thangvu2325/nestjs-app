import { Controller, Get } from '@nestjs/common';

import { CoapService } from './coap.service';

@Controller('coap')
export class CoapController {
  constructor(private readonly coapService: CoapService) {}

  @Get()
  getAllUser() {
    return this.coapService.sendRequest();
  }
}
