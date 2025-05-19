import { Logger, Module } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DevicesService } from 'src/devices/devices.service';
import { CoapService } from 'src/coap/coap.service';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from 'src/message/message.service';
import { NotificationService } from 'src/notification/notification.service';
import { ChatModule } from 'src/chat/chat.module';
import { TicketsService } from 'src/tickets/tickets.service';

import { DatabaseModule } from 'src/common/database.module';
import { ticketsEntity } from 'src/tickets/entity/tickets.entity';
import { ticketMessageEntity } from 'src/tickets/entity/ticket-message.entity';
import { NodeServices } from 'src/devices/nodes.service';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([ticketsEntity, ticketMessageEntity]),
    JwtModule,
    ChatModule,
    DevicesModule,
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    TicketsService,
    MailService,
    UsersService,
    DevicesService,
    Logger,
    CoapService,
    MessageService,
    NotificationService,
    NodeServices,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
