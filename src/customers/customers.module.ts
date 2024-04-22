import { Module } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { CustomersEntity } from './customers.entity';
import { UsersService } from 'src/users/users.service';
import { CustomersController } from './customers.controller';
import { UserEntity } from 'src/users/user.entity';
import { CustomersService } from './customers.service';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { NetworkEntity } from 'src/devices/entities/network.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { DevicesService } from 'src/devices/devices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomersEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([DevicesEntity]),
    TypeOrmModule.forFeature([BatteryEntity]),
    TypeOrmModule.forFeature([NetworkEntity]),
    TypeOrmModule.forFeature([SensorsEntity]),
    TypeOrmModule.forFeature([SignalEntity]),
    TypeOrmModule.forFeature([SimEntity]),
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    LoggerService,
    MailService,
    UsersService,
    DevicesService,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
