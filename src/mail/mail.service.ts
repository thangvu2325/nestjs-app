import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserEntity } from 'src/users/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(UserEntity)
    private readonly userRepository: UserEntity,
    private readonly logger: Logger,
  ) {}
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
        from: '7688d4002@smtp-brevo.com',
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
  public sendRequestVerifyEmail(
    secret_code: number,
    email: string,
    fullName: string,
  ): void {
    this.mailerService
      .sendMail({
        to: email, // List of receivers email address
        subject: 'Xác Thực Email ✔', // Subject line
        from: '7688d4001@smtp-brevo.com',
        template: 'verifyAccount',
        context: {
          secret_code,
          fullName,
        },
      })
      .then((success) => {
        console.log(process.env.EMAIL_ID);
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  public sendEmailWarning(email: string) {
    this.mailerService
      .sendMail({
        to: email,
        subject: 'Cảnh báo cháy ✔',
        from: '7688d4001@smtp-brevo.com',
        template: 'emailWarning',
        context: {},
      })
      .then(() => {
        this.logger.log(
          `Gửi Email đến người dùng với email ${email} thành công`,
        );
      })
      .catch((err) => {
        this.logger.log(
          `Gửi Email đến người dùng với email ${email} thất bại với lỗi ${err.message}`,
        );
      });
  }
}
