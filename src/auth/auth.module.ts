import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { PassportModule } from '@nestjs/passport';
import { MailService } from 'src/mail/mail.service';
import { CustomersModule } from 'src/customers/customers.module';
import { CustomersService } from 'src/customers/customers.service';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CoapService } from 'src/coap/coap.service';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { CoapClientIpAddressEntity } from 'src/coap/coapClientIpAddress.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { DevicesService } from 'src/devices/devices.service';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { NotificationService } from 'src/notification/notification.service';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomersEntity,
      DevicesEntity,
      VerifyEntity,
      UserEntity,
      SensorsEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
      HistoryEntity,
      CoapClientIpAddressEntity,
      Message,
      ClientSocketEntity,
      Notifications,
      NotificationToken,
      WarningLogsEntity,
    ]), // Add DevicesEntity here
    CustomersModule,
    RedisModule,
    PassportModule,
    ChatModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtService,
    MailService,
    CustomersService,
    Logger,
    CoapService,
    DevicesService,
    MessageService,
    NotificationService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
