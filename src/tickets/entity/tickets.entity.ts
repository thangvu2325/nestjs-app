import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

import { UserEntity } from 'src/users/entity/user.entity';
import { ticketMessageEntity } from './ticket-message.entity';

@Entity({
  name: 'tickets',
})
export class ticketsEntity extends BaseEntity {
  @Column({ default: '' })
  topic: string;
  @Column({
    type: 'enum',
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal',
  })
  priority: string;
  @ManyToOne(() => UserEntity, (user) => user.ticket)
  owner: UserEntity;
  @OneToOne(() => UserEntity)
  @JoinColumn()
  submiter: UserEntity;
  @OneToOne(() => ticketMessageEntity)
  @JoinColumn()
  reply: ticketMessageEntity;
  @Column({ default: '' })
  notes: string;
  @Column({ default: 0 })
  rate: number;
  @Column({
    type: 'enum',
    enum: ['Feeback', 'Error', 'Complaint'],
    default: 'Error',
  })
  category: string;
  @Column({
    type: 'enum',
    enum: ['RESOLVED', 'IN PROGRESS', 'PENDING', 'NEEDS CLARIFICATION'],
    default: 'PENDING',
  })
  status: string;
}
