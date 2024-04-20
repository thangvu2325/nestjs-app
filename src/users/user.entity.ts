import { Entity, Column, BeforeInsert, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import * as bcrypt from 'bcrypt';
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
    enum: ['Administrator', 'Moderator', 'Khách Hàng'],
    default: 'Khách Hàng',
  })
  role: string;
  @OneToOne(() => CustomersEntity)
  @JoinColumn()
  customer: CustomersEntity;
  @BeforeInsert()
  async hashPassword() {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
}
