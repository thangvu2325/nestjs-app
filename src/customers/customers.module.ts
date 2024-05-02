import { Logger, Module } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { CustomersEntity } from './customers.entity';
import { UsersService } from 'src/users/users.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { DevicesService } from 'src/devices/devices.service';
import { UserEntity } from 'src/users/entity/user.entity';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomersEntity,
      VerifyEntity,
      UserEntity,
      DevicesEntity,
      BatteryEntity,
      SensorsEntity,
      SignalEntity,
      SimEntity,
    ]),
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    LoggerService,
    MailService,
    UsersService,
    DevicesService,
    Logger,
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
