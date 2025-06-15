import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { BatteryEntity } from './battery.entity';
import { DevicesEntity } from './devices.entity';

@Entity({
  name: 'history',
})
export class HistoryEntity extends BaseEntity {
  @ManyToOne(() => DevicesEntity, (device) => device.history)
  device: DevicesEntity;
  @OneToOne(() => BatteryEntity)
  @JoinColumn()
  battery: BatteryEntity;
  @Column({ type: 'text', nullable: true }) // Cho phép null
  logger: string | null;
}
