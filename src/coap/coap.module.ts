// coap.module.ts
import { Logger, Module } from '@nestjs/common';
import { CoapService } from './coap.service';
import { CoapController } from './coap.controller';
import { DevicesService } from 'src/devices/devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { CoapClientIpAddressEntity } from './coapClientIpAddress.entity';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { MailService } from 'src/mail/mail.service';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CustomersService } from 'src/customers/customers.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { UsersService } from 'src/users/users.service';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      ClientSocketEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      VerifyEntity,
      SimEntity,
      HistoryEntity,
      NotificationToken,
      Notifications,
      CustomersEntity,
      Message,
      UserEntity,
      CoapClientIpAddressEntity,
      WarningLogsEntity,
    ]),
    ChatModule,
  ],
  controllers: [CoapController],
  providers: [
    CoapService,
    DevicesService,
    Logger,
    MessageService,
    MailService,
    CustomersService,
    NotificationService,
    UsersService,
  ],
  exports: [CoapService],
})
export class CoapModule {}
