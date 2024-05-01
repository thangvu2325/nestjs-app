import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'nestjs-twilio';

@Injectable()
export class SMSService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly configService: ConfigService,
  ) {
    // const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    // const authToken = configService.get('TWILIO_AUTH_TOKEN');
  }
  //   async sendSMS() {
  //     return this.twilioService.client.messages.create({
  //       body: 'SMS Body, sent to the phone!',
  //       from: TWILIO_PHONE_NUMBER,
  //       to: TARGET_PHONE_NUMBER,
  //     });
  //   }
  async sendOtp(phoneNumber: string) {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );
    let msg = '';
    console.log(phoneNumber);
    await this.twilioService.client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' })
      .then((verification) => (msg = verification.status));
    return { msg: msg };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );
    let msg = '';
    await this.twilioService.client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: code })
      .then((verification) => (msg = verification.status));
    return { msg: msg };
  }
}
