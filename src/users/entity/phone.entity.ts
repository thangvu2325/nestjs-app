import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { IsPhoneNumber } from 'class-validator';

@Entity({
  name: 'phone',
})
export class PhoneEntity extends BaseEntity {
  @Column({ default: null, unique: true })
  @IsPhoneNumber()
  phone: string;
  @Column({ default: null, unique: true })
  activeKey: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activeKeyExpiresAt: Date;
  @Column({
    type: 'enum',
    enum: [true, false],
    default: false,
  })
  active: string;
}
