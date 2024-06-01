import { BaseEntity } from 'src/common/mysql/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'secretKey',
})
export class SecretKeyEntity extends BaseEntity {
  @Column({ default: '' })
  secretKey: string;
  @Column({
    type: 'enum',
    enum: ['Administrator', 'Moderator', 'User'],
    default: 'Moderator',
  })
  role: string;
  @Column({ default: false })
  isUse: boolean;
}
