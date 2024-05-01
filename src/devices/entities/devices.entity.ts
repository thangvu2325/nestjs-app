import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';

import { HistoryEntity } from './history.entity';

@Entity({
  name: 'devices',
})
export class DevicesEntity extends BaseEntity {
  @ManyToOne(() => CustomersEntity, (customer) => customer.devices)
  customer: CustomersEntity;
  @Column({ unique: true })
  deviceId: string;
  @Column({ unique: true })
  secretKey: string;
  @OneToMany(() => HistoryEntity, (history) => history.device)
  history: HistoryEntity[];
}
