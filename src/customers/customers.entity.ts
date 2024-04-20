import { Entity, Column, OneToMany, BeforeInsert } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { NotifiesEntity } from 'src/notifies/notifies.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';

@Entity({
  name: 'customers',
})
export class CustomersEntity extends BaseEntity {
  @Column({ default: '' })
  first_name: string;

  @Column({ default: '' })
  last_name: string;

  @Column({ default: null, unique: true })
  @IsEmail()
  email: string;

  @Column({ default: null, unique: true })
  @IsPhoneNumber()
  phone: string;

  @Column()
  customer_id: string;

  @OneToMany(() => DevicesEntity, (devices) => devices.customer)
  devices: DevicesEntity[];

  @OneToMany(() => NotifiesEntity, (notifies) => notifies.customer)
  notifies: NotifiesEntity[];
  @BeforeInsert()
  async generateCustomerId() {
    // Tạo một mã customer_id duy nhất, ví dụ sử dụng UUID
    this.customer_id = generateUniqueId(); // Hãy thay đổi hàm generateUniqueId() cho phù hợp với mã của bạn
  }
}

// Hàm để tạo mã duy nhất
function generateUniqueId(): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  let uniqueId = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueId += characters.charAt(randomIndex);
  }

  // Kiểm tra tính duy nhất của chuỗi ngẫu nhiên
  // Bạn có thể thêm logic kiểm tra tính duy nhất tại đây, ví dụ kiểm tra trong cơ sở dữ liệu
  // Trong ví dụ này, chúng ta sẽ không thêm logic kiểm tra tính duy nhất

  return 'Customer_' + uniqueId;
}
