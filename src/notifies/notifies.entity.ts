import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';

@Entity({
  name: 'notifies',
})
export class NotifiesEntity extends BaseEntity {
  @ManyToOne(() => CustomersEntity, (customer) => customer.notifies)
  customer: CustomersEntity;
}
