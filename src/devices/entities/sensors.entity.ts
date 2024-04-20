import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'sensors',
})
export class SensorsEntity extends BaseEntity {
  @Column({ default: 0 })
  smokeValue: number;
}
