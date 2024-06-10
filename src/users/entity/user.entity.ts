import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { VerifyEntity } from './verifyKey.entity';
import { Room } from 'src/room/room.entity';
import { Message } from 'src/message/message.entity';
import { ticketsEntity } from 'src/tickets/entity/tickets.entity';

@Entity({
  name: 'user',
})
export class UserEntity extends BaseEntity {
  @Column({ default: null, unique: true })
  username: string;
  @Column({ default: '' })
  password: string;
  @Column({ default: '' })
  avatar: string;

  @Column({ default: false })
  isActive: boolean;
  @Column({ default: null, unique: true })
  @IsEmail()
  email: string;
  @Column({ default: null, unique: true })
  @IsPhoneNumber()
  phone: string;
  @Column({
    type: 'enum',
    enum: ['Administrator', 'Moderator', 'User'],
    default: 'User',
  })
  role: string;
  @OneToOne(() => CustomersEntity)
  @JoinColumn()
  customer: CustomersEntity;

  @OneToOne(() => VerifyEntity)
  @JoinColumn()
  verify: VerifyEntity;

  @OneToMany(() => Message, (message) => message.owner)
  messages: Message[];
  @OneToMany(() => Room, (room) => room.owner)
  rooms: Room[];
  @OneToMany(() => ticketsEntity, (ticket) => ticket.owner)
  ticket: ticketsEntity[];

  @OneToMany(() => Room, (room) => room.submiter)
  roomSubmited: Room[];

  @ManyToMany(() => Room, (room) => room.members)
  joinedRooms: Room[];
}
