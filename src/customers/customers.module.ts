import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { CustomersEntity } from './customers.entity';
import { UsersService } from 'src/users/users.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { DevicesService } from 'src/devices/devices.service';
import { UserEntity } from 'src/users/entity/user.entity';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CoapService } from 'src/coap/coap.service';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { NotificationService } from 'src/notification/notification.service';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';
import { Room } from 'src/room/room.entity';
import { TicketsService } from 'src/tickets/tickets.service';
import { ticketsEntity } from 'src/tickets/entity/tickets.entity';
import { ticketMessageEntity } from 'src/tickets/entity/ticket-message.entity';
import { KeyAddDeviceEntity } from './keyAddDevice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomersEntity,
      ticketsEntity,
      ticketMessageEntity,
      VerifyEntity,
      UserEntity,
      DevicesEntity,
      Message,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
      HistoryEntity,
      Notifications,
      NotificationToken,
      WarningLogsEntity,
      KeyAddDeviceEntity,
      Room,
    ]),
    JwtModule,
    ChatModule,
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
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
