// coap.module.ts
import { Module } from '@nestjs/common';
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
import { ClientSocketEntity } from './clientSocket.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([DevicesEntity]),
    TypeOrmModule.forFeature([BatteryEntity]),
    TypeOrmModule.forFeature([SensorsEntity]),
    TypeOrmModule.forFeature([SignalEntity]),
    TypeOrmModule.forFeature([SimEntity]),
    TypeOrmModule.forFeature([HistoryEntity]),
    TypeOrmModule.forFeature([CustomersEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([ClientSocketEntity]),
    JwtModule,
  ],
  controllers: [],
  providers: [DevicesService, ChatGateway],
})
export class ChatModule {}
