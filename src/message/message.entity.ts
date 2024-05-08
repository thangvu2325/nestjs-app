import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Room } from '../room/room.entity';
import { UserEntity } from 'src/users/entity/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  owner: UserEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
