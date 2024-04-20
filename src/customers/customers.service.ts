import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass } from 'class-transformer';
import { CustomersEntity } from './customers.entity';
import { CustomersDto } from './customers.dto';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/user.entity';
import { DevicesDto } from 'src/devices/dto/devices.dto';

@Injectable()
export class CustomersService extends MysqlBaseService<
  CustomersEntity,
  CustomersDto
> {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customersReposity: Repository<CustomersEntity>,
    @InjectRepository(UserEntity)
    private readonly usersReposity: Repository<UserEntity>,
    private readonly usersService: UsersService,
  ) {
    super(customersReposity, CustomersDto);
  }
  async findAll(
    query,
  ): Promise<{ customers: Array<CustomersDto>; customersCount: number }> {
    const qb = await this.customersReposity
      .createQueryBuilder('customers')
      .leftJoinAndSelect('customers.devices', 'devices')
      .leftJoinAndSelect('customers.user', 'user');
    qb.where('1 = 1');
    qb.orderBy('customers.createdAt', 'DESC'); // Corrected the alias to 'posts'
    const customersCount = await qb.getCount();
    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const customerList = await qb.getMany();
    const customersDtoArray = customerList.map((customer) => {
      return plainToClass(
        CustomersDto,
        {
          ...customer,
          devices: customer.devices.map((device) => {
            return plainToClass(
              DevicesDto,
              {
                ...device,
              },
              { excludeExtraneousValues: true },
            );
          }),
        },
        { excludeExtraneousValues: true },
      );
    });

    return { customers: customersDtoArray, customersCount };
  }
  async saveCustomer(
    userId: string,
    Dto: CustomersDto,
  ): Promise<{ result: string }> {
    // Truy vấn user dựa trên userId
    const userFounded = await this.usersReposity
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .where('user.id = :userId', { userId: userId })
      .getOne();

    // Kiểm tra xem user có tồn tại hay không
    if (!userFounded) {
      return { result: 'không tìm thấy user' };
    }
    if (userFounded.customer.id) {
      return { result: 'Tài khoản này đã đăng ký khách hàng' };
    }
    // Tạo một khách hàng mới từ đối tượng CustomersEntity và gán giá trị từ Dto
    const newCustomer = this.customersReposity.create({
      ...Dto,
    });

    // Lưu khách hàng mới vào cơ sở dữ liệu
    await this.customersReposity.save(newCustomer);
    // Gán khách hàng mới cho user và cập nhật vào cơ sở dữ liệu
    userFounded.customer = newCustomer;
    await this.usersReposity.save(userFounded);
    // Trả về kết quả thành công
    return { result: 'thành công' };
  }
}
