import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'sensors',
})
export class SensorsEntity extends BaseEntity {
  @Column({ default: 0 })
  SmokeValue: number;
  @Column({ default: false })
  AlarmSatus: boolean;
  @Column({ default: 0 })
  Temperature: number;
  @Column({ default: 0 })
  Humidity: number;
}
