import { Logger, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LoggerService } from 'src/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { MailService } from 'src/mail/mail.service';
import { CustomersService } from 'src/customers/customers.service';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { VerifyEntity } from './entity/verifyKey.entity';
import { CoapService } from 'src/coap/coap.service';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { CoapClientIpAddressEntity } from 'src/coap/coapClientIpAddress.entity';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { DevicesService } from 'src/devices/devices.service';
import { JwtService } from '@nestjs/jwt';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notifications } from 'src/notification/entities/notification.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      UserEntity,
      CustomersEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
      VerifyEntity,
      HistoryEntity,
      CoapClientIpAddressEntity,
      ClientSocketEntity,
      Notifications,
      NotificationToken,
      WarningLogsEntity,
    ]),
    ChatModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    LoggerService,
    MailService,
    CustomersService,
    Logger,
    CoapService,
    DevicesService,
    JwtService,
    MessageService,
    NotificationService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
