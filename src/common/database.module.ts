// database.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersEntity } from 'src/customers/customers.entity';
import { KeyAddDeviceEntity } from 'src/customers/keyAddDevice.entity';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { deviceAlarmEntity } from 'src/devices/entities/deviceAlarm.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { NodeHistoryEntity } from 'src/devices/entities/nodeHistory.entity';
import { NodesEntity } from 'src/devices/entities/nodes.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { Message } from 'src/message/message.entity';
import { NotificationToken } from 'src/notification/entities/notification-token.entity';
import { Notifications } from 'src/notification/entities/notification.entity';
import { Room } from 'src/room/room.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';

// Danh sách tất cả entities
const ALL_ENTITIES = [
  CustomersEntity,
  Message,
  UserEntity,
  VerifyEntity,
  DevicesEntity,
  NodesEntity,
  BatteryEntity,
  SensorsEntity,
  NodeHistoryEntity,
  SignalEntity,
  SimEntity,
  KeyAddDeviceEntity,
  deviceAlarmEntity,
  HistoryEntity,
  Notifications,
  NotificationToken,
  WarningLogsEntity,
  Room,
];

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES)], // Đăng ký tất cả entities theo giải pháp 1
  exports: [TypeOrmModule], // Export để các module khác sử dụng
})
export class DatabaseModule {
  // Dynamic Module theo giải pháp 2
  static forFeature(entities: any[] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forFeature(entities)], // Chỉ đăng ký các entities được chỉ định
      exports: [TypeOrmModule],
    };
  }
}
