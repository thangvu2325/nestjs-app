import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
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
import { ChatGateway } from 'src/chat/chat.gateway';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { DevicesService } from 'src/devices/devices.service';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { MessageService } from 'src/message/message.service';
import { Message } from 'src/message/message.entity';

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
    ]), // Add DevicesEntity here
    UsersModule,
    CustomersModule,
    RedisModule,
    PassportModule,
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
    ChatGateway,
    DevicesService,
    MessageService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
