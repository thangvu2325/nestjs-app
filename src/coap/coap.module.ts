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
import { ChatGateway } from 'src/chat/chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ClientSocketEntity } from 'src/chat/clientSocket.entity';
import { CoapClientIpAddressEntity } from './coapClientIpAddress.entity';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([
      ClientSocketEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
      HistoryEntity,
      CustomersEntity,
      UserEntity,
      CoapClientIpAddressEntity,
    ]),
  ],
  controllers: [CoapController],
  providers: [CoapService, DevicesService, ChatGateway, Logger],
})
export class CoapModule {}
