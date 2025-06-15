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
import { ChatModule } from './chat/chat.module';
import { VerifyEntity } from './users/entity/verifyKey.entity';
import { Room } from './room/room.entity';
import { Message } from './message/message.entity';
import { NotificationModule } from './notification/notification.module';
import { NotificationToken } from './notification/entities/notification-token.entity';
import { Notifications } from './notification/entities/notification.entity';
import { WarningLogsEntity } from './devices/entities/warningLogs.entity';
import { RoomModule } from './room/room.module';
import { MessageModule } from './message/message.module';
import { SecretKeyEntity } from './auth/entity/secretKey.entity';
import { TicketModule } from './tickets/tickets.module';
import { ticketsEntity } from './tickets/entity/tickets.entity';
import { ticketMessageEntity } from './tickets/entity/ticket-message.entity';
import { KeyAddDeviceEntity } from './customers/keyAddDevice.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { NodesEntity } from './devices/entities/nodes.entity';
import { DatabaseModule } from './common/database.module';
import { MqttModule } from './mqtt';
import { DataSource } from 'typeorm';
import { NodeHistoryEntity } from './devices/entities/nodeHistory.entity';
import { deviceAlarmEntity } from './devices/entities/deviceAlarm.entity';
import { mqttOptions } from './mqtt/mqttOptions';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timezone: 'local',
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
          NodesEntity,
          SimEntity,
          SignalEntity,
          deviceAlarmEntity,
          HistoryEntity,
          VerifyEntity,
          ticketsEntity,
          NodeHistoryEntity,
          Room,
          Message,
          NotificationToken,
          Notifications,
          WarningLogsEntity,
          ticketMessageEntity,
          SecretKeyEntity,
          KeyAddDeviceEntity,
        ],
        synchronize: true,
      }),
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options);
        return await dataSource.initialize();
      },
    }),
    DatabaseModule,
    CustomersModule,
    UsersModule,
    AuthModule,
    DevicesModule,
    RedisModule,
    MailModule,
    SMSModule,
    ChatModule,
    NotificationModule,
    RoomModule,
    MessageModule,
    TicketModule,
    MqttModule.forRoot(mqttOptions),
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
