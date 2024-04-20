import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'network',
})
export class NetworkEntity extends BaseEntity {
  @Column({ default: '' })
  absoluteRadioFrequencyChannel: string;
  @Column({ default: '' })
  areaTacChangeCount: string;
  @Column({ default: '' })
  cellChangeCount: string;
  @Column({ default: '' })
  cellId: string;
  @Column({ default: '' })
  connectionStatus: string;
  @Column({ default: '' })
  extendedDiscontinuousReception: string;
  @Column({ default: '' })
  ipAddress: string;
  @Column({ default: '' })
  mcc: string;
  @Column({ default: '' })
  mnc: string;
  @Column({ default: '' })
  referenceSignalReceivedPower: string;
  @Column({ default: '' })
  referenceSignalReceivedQuality: string;
  @Column({ default: '' })
  requestedActiveTime: string;
  @Column({ default: '' })
  requestedPeriodicTrackingAreaUpdate: string;
  @Column({ default: '' })
  tac: string;
}
