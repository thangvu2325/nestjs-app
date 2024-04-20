import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'sim',
})
export class SimEntity extends BaseEntity {
  @Column({ default: '' })
  imsi: string;
}
