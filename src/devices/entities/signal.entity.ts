import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { NetworkEntity } from './network.entity';

@Entity({
  name: 'signal',
})
export class SignalEntity extends BaseEntity {
  @Column({ default: '' })
  band: string;
  @Column({ default: 0 })
  deviceNetworkRssiDbm: number;
  @Column({ default: '' })
  gsmStatus: string;

  @OneToOne(() => NetworkEntity)
  @JoinColumn()
  networkReport: NetworkEntity;
}
