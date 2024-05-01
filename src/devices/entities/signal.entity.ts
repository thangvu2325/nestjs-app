import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'signal',
})
export class SignalEntity extends BaseEntity {
  @Column({ default: '' })
  Operator: string;
  @Column({ default: '' })
  band: string;
  @Column({ default: '' })
  EARFCN: string;
  @Column({ default: '' })
  PCI: string;
  @Column({ default: '' })
  connectionStatus: string;
  @Column({ default: '' })
  ipAddress: string;
  @Column({ default: '' })
  mcc: string;
  @Column({ default: '' })
  mnc: string;
  @Column({ default: '' })
  RSRP: string;
  @Column({ default: '' })
  RSSI: string;
  @Column({ default: '' })
  RSRQ: string;
  @Column({ default: '' })
  T3324: string;
  @Column({ default: '' })
  T3412: string;
  @Column({ default: '' })
  tac: string;
}
