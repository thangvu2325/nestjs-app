import { Entity, OneToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

import { UserEntity } from 'src/users/entity/user.entity';

@Entity({
  name: 'ticketMessage',
})
export class ticketMessageEntity extends BaseEntity {
  @OneToOne(() => UserEntity)
  @JoinColumn()
  owner: UserEntity;
  @Column('')
  message: string;
}
