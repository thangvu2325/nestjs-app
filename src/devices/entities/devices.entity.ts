import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';

import { HistoryEntity } from './history.entity';
import { WarningLogsEntity } from './warningLogs.entity';
import { Room } from 'src/room/room.entity';

@Entity({
  name: 'devices',
})
export class DevicesEntity extends BaseEntity {
  @ManyToMany(() => CustomersEntity, (customer) => customer.devices)
  @JoinTable()
  customers: CustomersEntity[];
  @OneToOne(() => CustomersEntity)
  @JoinColumn()
  owner: CustomersEntity;
  @Column({ unique: true })
  deviceId: string;
  @Column({ default: '' })
  deviceName: string;
  @Column({ unique: true })
  secretKey: string;
  @OneToMany(() => HistoryEntity, (history) => history.device)
  history: HistoryEntity[];
  @OneToMany(() => WarningLogsEntity, (warninglogs) => warninglogs.device)
  warningLogs: WarningLogsEntity[];
  @Column({
    type: 'enum',
    enum: [1, 0],
    default: 1,
  })
  AlarmReport: number;
  @OneToOne(() => Room)
  @JoinColumn()
  room: Room;
}
