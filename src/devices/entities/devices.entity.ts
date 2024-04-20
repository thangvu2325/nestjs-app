import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { SensorsEntity } from './sensors.entity';
import { BatteryEntity } from './battery.entity';
import { SignalEntity } from './signal.entity';
import { SimEntity } from './sim.entity';

@Entity({
  name: 'devices',
})
export class DevicesEntity extends BaseEntity {
  @ManyToOne(() => CustomersEntity, (customer) => customer.devices)
  customer: CustomersEntity;
  @Column({ unique: true })
  deviceId: string;
  @Column({ default: 0 })
  rssi: number;

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
}
