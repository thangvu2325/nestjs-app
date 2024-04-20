import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  public example(): void {
    this.mailerService
      .sendMail({
        to: 'thangvu2325@gmail.com', // List of receivers email address
        subject: 'Testing Nest MailerModule ✔', // Subject line
        from: 'thangvu1560@gmail.com',
        text: 'welcome', // plaintext body
        html: '<b>welcome</b>', // HTML body content
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  public sendNotifyChangePassword(
    ten_nhan_vien: string,
    email: string,
    password: string,
  ): void {
    this.mailerService
      .sendMail({
        to: email, // List of receivers email address
        subject: 'Reset Mật Khẩu ✔', // Subject line
        from: 'workflowhub@gmail.com',
        template: 'index',
        context: {
          // Data to be sent to template engine.
          ten_nhan_vien,
          email,
          password,
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
