import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryEntity]),
    TypeOrmModule.forFeature([DevicesEntity]),
    TypeOrmModule.forFeature([BatteryEntity]),
    TypeOrmModule.forFeature([SensorsEntity]),
    TypeOrmModule.forFeature([SignalEntity]),
    TypeOrmModule.forFeature([SimEntity]),
    TypeOrmModule.forFeature([CustomersEntity]),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [DevicesController, HistoryController],
  providers: [DevicesService, JwtService, HistoryService],
  exports: [DevicesService],
})
export class DevicesModule {}
