import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class NhanvienController {
  constructor(private readonly mailService: MailService) {}

  @Get('send')
  sendMail() {
    return this.mailService.example();
  }
}
