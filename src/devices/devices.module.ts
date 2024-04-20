import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesEntity } from './entities/devices.entity';
import { BatteryEntity } from './entities/battery.entity';
import { NetworkEntity } from './entities/network.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { SignalEntity } from './entities/signal.entity';
import { SimEntity } from './entities/sim.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
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
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
