import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { IsEmail, IsPhoneNumber } from 'class-validator';

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
}
