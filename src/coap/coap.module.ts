// coap.module.ts
import { Module } from '@nestjs/common';
import { CoapService } from './coap.service';
import { CoapController } from './coap.controller';
import { DevicesService } from 'src/devices/devices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { NetworkEntity } from 'src/devices/entities/network.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([DevicesEntity]),
    TypeOrmModule.forFeature([BatteryEntity]),
    TypeOrmModule.forFeature([NetworkEntity]),
    TypeOrmModule.forFeature([SensorsEntity]),
    TypeOrmModule.forFeature([SignalEntity]),
    TypeOrmModule.forFeature([SimEntity]),
    TypeOrmModule.forFeature([CustomersEntity]),
  ],
  controllers: [CoapController],
  providers: [CoapService, DevicesService],
})
export class CoapModule {}
