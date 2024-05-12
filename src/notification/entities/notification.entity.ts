import { Entity, Column, ManyToOne } from 'typeorm';
import { NotificationToken } from './notification-token.entity';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({ name: 'notifications' })
export class Notifications extends BaseEntity {
  @ManyToOne(() => NotificationToken)
  notification_token: NotificationToken;

  @Column()
  title: string;

  @Column({ type: 'longtext', nullable: true })
  body: any;

  @Column({
    default: 'ACTIVE',
  })
  status: string;
}
