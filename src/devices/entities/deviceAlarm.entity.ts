import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { DevicesEntity } from './devices.entity';

@Entity({
  name: 'deviceAlarm',
})
export class deviceAlarmEntity {
  @Column({})
  type: 'Station' | 'Node';
  @PrimaryColumn({ unique: true })
  id: string;
  @ManyToOne(() => DevicesEntity, (device) => device.deviceAlarm)
  @JoinColumn()
  device: DevicesEntity;
}
