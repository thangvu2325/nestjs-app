import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'signal',
})
export class SignalEntity extends BaseEntity {
  @Column({ default: '' })
  Operator: string;
  @Column({ default: 0 })
  band: number;
  @Column({ default: 0 })
  EARFCN: number;
  @Column({ default: 0 })
  PCI: number;
  @Column({ default: 0 })
  connectionStatus: number;
  @Column({ default: '' })
  ipAddress: string;
  @Column({ default: 0 })
  RSRP: number;
  @Column({ default: 0 })
  RSSI: number;
  @Column({ default: 0 })
  RSRQ: number;
  @Column({ default: 0 })
  T3324: number;
  @Column({ default: 0 })
  T3412: number;
  @Column({ default: '' })
  tac: string;
}
