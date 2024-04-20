import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'battery',
})
export class BatteryEntity extends BaseEntity {
  @Column({ default: 0 })
  voltage: number;
  @Column({ default: '' })
  source: string;
}
