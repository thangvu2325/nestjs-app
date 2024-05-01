import { Body, Controller, Get, Post } from '@nestjs/common';
import { SMSService } from './sms.service';

@Controller('sms')
export class SMSController {
  constructor(private readonly smsService: SMSService) {}

  @Get()
  getAllUser() {
    // return this.smsService.findAll({});
    return '';
  }
  @Post('/SendOtp')
  async sendOtp(@Body() data: { phone: string }): Promise<{ msg: string }> {
    const prefix = '+84';
    const phone = prefix.concat(data.phone);
    return await this.smsService.sendOtp(phone);
  }
  @Post('/VerifyOtp')
  async verifyOtp(
    @Body() data: { phone: string; otp: string },
  ): Promise<{ msg: string }> {
    const prefix = '+91';
    const phone = prefix.concat(data.phone);
    return await this.smsService.verifyOtp(phone, data.otp);
  }
}
