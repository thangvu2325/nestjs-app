import { Column, Entity, ManyToOne } from 'typeorm';

import { Room } from '../room/room.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity('message')
export class Message extends BaseEntity {
  @Column()
  content: string;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  owner: UserEntity;
}
