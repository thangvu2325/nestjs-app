import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Message } from '../message/message.entity';
import { UserEntity } from 'src/users/entity/user.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @ManyToOne(() => UserEntity, (user) => user.rooms)
  owner: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.joinedRooms)
  @JoinTable()
  members: UserEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
