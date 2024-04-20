import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Inject, Req } from '@nestjs/common/decorators';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(@Inject('App_User') private readonly appService: AppService) {}

  @Get()
  getInfo(@Req() req: Request) {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    console.log('WebSocket Server URL:', serverUrl);
    return { serverUrl };
  }
}
