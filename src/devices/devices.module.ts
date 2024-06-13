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
import { CoapService } from 'src/coap/coap.service';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CustomersService } from 'src/customers/customers.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { NotificationService } from 'src/notification/notification.service';
import { WarningLogsEntity } from './entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';
import { Room } from 'src/room/room.entity';
import { WarningLogsService } from './warningLogs.service';
import { WarningLogsController } from './warningLogs.controller';
import { KeyAddDeviceEntity } from 'src/customers/keyAddDevice.entity';

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
      KeyAddDeviceEntity,
      HistoryEntity,
      Notifications,

      NotificationToken,
      WarningLogsEntity,
      Room,
    ]),
    ChatModule,
  ],
  controllers: [DevicesController, HistoryController, WarningLogsController],
  providers: [
    DevicesService,
    JwtService,
    HistoryService,
    DevicesService,
    CoapService,
    CustomersService,
    MailService,
    UsersService,
    DevicesService,
    Logger,
    MessageService,
    NotificationService,
    WarningLogsService,
  ],
  exports: [DevicesService, HistoryService, WarningLogsService],
})
export class DevicesModule {}
