import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesEntity } from './entities/devices.entity';
import { BatteryEntity } from './entities/battery.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { SignalEntity } from './entities/signal.entity';
import { SimEntity } from './entities/sim.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { CustomersEntity } from 'src/customers/customers.entity';
import { JwtService } from '@nestjs/jwt';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryEntity } from './entities/history.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { CoapClientIpAddressEntity } from 'src/coap/coapClientIpAddress.entity';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { CoapService } from 'src/coap/coap.service';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CustomersService } from 'src/customers/customers.service';
import { LoggerService } from 'src/logger/logger.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { NotificationService } from 'src/notification/notification.service';
import { WarningLogsEntity } from './entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomersEntity,
      Message,
      UserEntity,
      VerifyEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
      HistoryEntity,
      CoapClientIpAddressEntity,
      ClientSocketEntity,
      Notifications,
      NotificationToken,
      WarningLogsEntity,
    ]),
    ChatModule,
  ],
  controllers: [DevicesController, HistoryController],
  providers: [
    DevicesService,
    JwtService,
    HistoryService,
    DevicesService,
    CoapService,
    CustomersService,
    LoggerService,
    MailService,
    UsersService,
    DevicesService,
    Logger,
    MessageService,
    NotificationService,
  ],
  exports: [DevicesService, HistoryService],
})
export class DevicesModule {}
