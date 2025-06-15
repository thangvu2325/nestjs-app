import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';

import { WarningLogsEntity } from './warningLogs.entity';
import { Room } from 'src/room/room.entity';
import { NodesEntity } from './nodes.entity';
import { SensorsEntity } from './sensors.entity';
import { deviceAlarmEntity } from './deviceAlarm.entity';
import { HistoryEntity } from './history.entity';

@Entity({
  name: 'devices',
})
export class DevicesEntity extends BaseEntity {
  @ManyToMany(() => CustomersEntity, (customer) => customer.devices)
  @JoinTable()
  customers: CustomersEntity[];
  @ManyToOne(() => CustomersEntity, (customer) => customer.myDevice)
  @JoinColumn()
  owner: CustomersEntity;
  @Column({ unique: true })
  deviceId: string;
  @Column({ default: '' })
  deviceName: string;
  @Column({ unique: true })
  secretKey: string;
  @OneToMany(() => deviceAlarmEntity, (deviceAlarm) => deviceAlarm.device)
  deviceAlarm: deviceAlarmEntity[];
  @OneToMany(() => WarningLogsEntity, (warninglogs) => warninglogs.device)
  warningLogs: WarningLogsEntity[];
  @OneToMany(() => HistoryEntity, (history) => history.device)
  history: HistoryEntity[];
  @Column({
    type: 'enum',
    enum: [1, 0],
    default: 0,
  })
  AlarmReport: number;
  @OneToOne(() => Room)
  @JoinColumn()
  room: Room;
  @OneToOne(() => Room)
  @JoinColumn()
  historyLoggerRoom: Room;
  @OneToMany(() => NodesEntity, (node) => node.device)
  nodes: NodesEntity[];
  @OneToOne(() => SensorsEntity)
  @JoinColumn()
  sensor: SensorsEntity;
}
