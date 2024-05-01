import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TwilioModule } from 'nestjs-twilio';
import { SMSService } from './sms.service';
import { SMSController } from './sms,controller';

@Module({
  imports: [
    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        accountSid: cfg.get('TWILIO_ACCOUNT_SID'),
        authToken: cfg.get('TWILIO_AUTH_TOKEN'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SMSController],
  providers: [SMSService, ConfigService],
  exports: [SMSService],
})
export class SMSModule {}
