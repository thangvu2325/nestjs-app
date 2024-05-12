import { BaseEntity } from 'src/common/mysql/base.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { Entity, Column, ManyToOne } from 'typeorm';

@Entity({ name: 'notification_tokens' })
export class NotificationToken extends BaseEntity {
  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column()
  device_type: string;

  @Column()
  notification_token: string;

  @Column({
    default: 'ACTIVE',
  })
  status: string;
}
