// coap.module.ts
import { Logger, Module } from '@nestjs/common';
import { DevicesService } from 'src/devices/devices.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from 'src/message/message.service';
import { DatabaseModule } from 'src/common/database.module';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/mail/mail.service';
import { NodeServices } from 'src/devices/nodes.service';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [],
  providers: [
    DevicesService,
    ChatGateway,
    MessageService,
    Logger,
    NotificationService,
    MailService,
    NodeServices,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
