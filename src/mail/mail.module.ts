import 'dotenv/config';
import { Logger, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer/';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entity/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        tls: {
          ciphers: 'SSLv3',
        },
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_ID, // generated ethereal user
          pass: process.env.EMAIL_PASS, // generated ethereal password
        },
      },
      defaults: {
        from: '"nest-modules" <thangvu1560@gmail.com>', // outgoing email ID
      },
      template: {
        dir: process.cwd() + '/template/',
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [],
  providers: [MailService, Logger],
  exports: [MailService],
})
export class MailModule {}
