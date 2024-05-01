import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { CustomersEntity } from './customers/customers.entity';
import { NotifiesEntity } from './notifies/notifies.entity';
import { CoapModule } from './coap/coap.module';
import { CustomersModule } from './customers/customers.module';
import { DevicesEntity } from './devices/entities/devices.entity';

import { SensorsEntity } from './devices/entities/sensors.entity';
import { BatteryEntity } from './devices/entities/battery.entity';
import { SimEntity } from './devices/entities/sim.entity';
import { SignalEntity } from './devices/entities/signal.entity';
import { DevicesModule } from './devices/devices.module';
import { UserEntity } from './users/entity/user.entity';
import { SMSModule } from './sms/sms.module';
import { HistoryEntity } from './devices/entities/history.entity';
import { ClientSocketEntity } from './chat/clientSocket.entity';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQLDB_HOST'),
        port: configService.get('MYSQLDB_LOCAL_PORT'),
        username: configService.get('MYSQLDB_USER'),
        password: configService.get('MYSQLDB_PASSWORD'),
        database: configService.get('MYSQLDB_DATABASE'),
        entities: [
          UserEntity,
          CustomersEntity,
          DevicesEntity,
          NotifiesEntity,
          SensorsEntity,
          BatteryEntity,
          SimEntity,
          SignalEntity,
          HistoryEntity,
          ClientSocketEntity,
        ],
        synchronize: true,
      }),
    }),

    CustomersModule,
    UsersModule,
    AuthModule,
    DevicesModule,
    RedisModule,
    MailModule,
    CoapModule,
    SMSModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'App_User',
      useClass: AppService,
    },
  ],
  exports: [],
})
export class AppModule {}
