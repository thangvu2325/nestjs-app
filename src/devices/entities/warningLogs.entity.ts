import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { DevicesEntity } from './devices.entity';

@Entity({
  name: 'warningLogs',
})
export class WarningLogsEntity extends BaseEntity {
  @Column({ default: '' })
  message: string;
  @ManyToOne(() => DevicesEntity, (device) => device.warningLogs)
  device: DevicesEntity;
}
