import { Logger, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailService } from 'src/mail/mail.service';
import { CustomersService } from 'src/customers/customers.service';
import { CoapService } from 'src/coap/coap.service';
import { DevicesService } from 'src/devices/devices.service';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from 'src/message/message.service';
import { NotificationService } from 'src/notification/notification.service';

import { ChatModule } from 'src/chat/chat.module';

import { DatabaseModule } from 'src/common/database.module';
import { NodeServices } from 'src/devices/nodes.service';

@Module({
  imports: [DatabaseModule, ChatModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    MailService,
    CustomersService,
    Logger,
    CoapService,
    DevicesService,
    JwtService,
    MessageService,
    NotificationService,
    NodeServices,
  ],
  exports: [UsersService],
})
export class UsersModule {}
