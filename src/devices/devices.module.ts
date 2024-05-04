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
import { ChatGateway } from 'src/chat/chat.gateway';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';
import { CustomersService } from 'src/customers/customers.service';
import { LoggerService } from 'src/logger/logger.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomersEntity,
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
    ]),
  ],
  controllers: [DevicesController, HistoryController],
  providers: [
    DevicesService,
    JwtService,
    HistoryService,
    CoapService,
    DevicesService,
    CoapService,
    ChatGateway,
    CustomersService,
    LoggerService,
    MailService,
    UsersService,
    DevicesService,
    Logger,
  ],
  exports: [DevicesService],
})
export class DevicesModule {}
