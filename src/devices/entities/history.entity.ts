import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { SensorsEntity } from './sensors.entity';
import { BatteryEntity } from './battery.entity';
import { SignalEntity } from './signal.entity';
import { SimEntity } from './sim.entity';
import { DevicesEntity } from './devices.entity';

@Entity({
  name: 'history',
})
export class HistoryEntity extends BaseEntity {
  @ManyToOne(() => DevicesEntity, (device) => device.history)
  device: DevicesEntity;
  @OneToOne(() => SensorsEntity)
  @JoinColumn()
  sensors: SensorsEntity;
  @OneToOne(() => BatteryEntity)
  @JoinColumn()
  battery: BatteryEntity;
  @OneToOne(() => SignalEntity)
  @JoinColumn()
  signal: SignalEntity;
  @OneToOne(() => SimEntity)
  @JoinColumn()
  sim: SimEntity;
  @Column({ type: 'text' })
  logger: string;
}
