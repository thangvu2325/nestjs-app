import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { Message } from '../message/message.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity('room')
export class Room extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ['message-suporter', 'message-device'],
    default: 'message-suporter',
  })
  type: string;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @ManyToOne(() => UserEntity, (user) => user.rooms)
  owner: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.joinedRooms)
  @JoinTable()
  members: UserEntity[];
  @Column({ default: false })
  request: boolean;
  @Column({
    type: 'enum',
    enum: ['RESOLVED', 'IN PROGRESS', 'PENDING', 'NEEDS CLARIFICATION'],
    default: 'PENDING',
  })
  status: string;
  @OneToOne(() => UserEntity)
  @JoinColumn()
  submiter: UserEntity;
  @Column({ default: 0 })
  rate: number;
}
