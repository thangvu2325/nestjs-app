import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass } from 'class-transformer';
import { CustomersEntity } from './customers.entity';
import { CustomersDto } from './customers.dto';
import { DevicesDto } from 'src/devices/dto/devices.dto';

import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { CoapService } from 'src/coap/coap.service';

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
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    private readonly coapService: CoapService,
  ) {
    super(customersReposity, CustomersDto);
  }
  async findAll(
    query,
  ): Promise<{ customers: Array<CustomersDto>; customersCount: number }> {
    const qb = await this.customersReposity
      .createQueryBuilder('customers')
      .leftJoinAndSelect('customers.devices', 'devices')
      .where('1= 1');

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
          ...{
            ...customer,
            fullName: customer.last_name + customer.first_name,
          },
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
    if (userFounded?.customer?.id) {
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
  async addDevice(
    dto: DevicesDto,
    customerId: string,
  ): Promise<{ result: string }> {
    // Tìm khách hàng dựa trên customerId và load danh sách thiết bị của khách hàng đó
    const customer = await this.customersReposity.findOne({
      where: { customer_id: customerId },
      relations: ['devices'],
    });

    // Kiểm tra xem khách hàng có tồn tại hay không
    if (!customer) {
      throw new HttpException(
        `Không tìm thấy khách hàng`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Tìm thiết bị dựa trên deviceId
    const device = await this.devicesReposity.findOne({
      where: { deviceId: dto.deviceId },
    });

    // Kiểm tra xem thiết bị có tồn tại hay không
    if (!device) {
      throw new HttpException(`Không tìm thấy thiết bị`, HttpStatus.FORBIDDEN);
    }

    // Kiểm tra mã bí mật của thiết bị
    if (device.secretKey !== dto.secretKey) {
      throw new HttpException(`Mã bí mật không đúng`, HttpStatus.FORBIDDEN);
    }

    // Gửi yêu cầu kết nối đến thiết bị
    await this.coapService.sendRequestToClient(
      device.deviceId,
      'kết nối thành công',
    );
    if (!customer.devices) {
      customer.devices = []; // Khởi tạo mảng nếu chưa tồn tại
    }
    // Thêm thiết bị vào danh sách thiết bị của khách hàng
    customer.devices.push(device);
    await this.customersReposity.save(customer);
    if (!device.customers) {
      device.customers = []; // Khởi tạo mảng nếu chưa tồn tại
    }
    // Thêm khách hàng vào danh sách khách hàng của thiết bị
    device.customers.push(customer);
    await this.devicesReposity.save(device);

    return { result: 'Thành công' };
  }
  async updateDevice(
    Dto: DevicesDto,
    customer_id: string,
    deviceId: string,
  ): Promise<{ result: string }> {
    const customerFound = await this.customersReposity
      .createQueryBuilder('customers')
      .leftJoinAndSelect('customers.devices', 'devices')
      .where({
        customer_id,
      })
      .getOne();
    if (!customerFound) {
      throw new HttpException(
        `Không tìm thấy người dùng`,
        HttpStatus.FORBIDDEN,
      );
    }
    const deviceFound = customerFound.devices.find(
      (device) => device.deviceId === deviceId,
    );
    if (!deviceFound) {
      throw new HttpException(
        `người dùng với ${customer_id} không tìm thấy thiết bị với ${deviceId}`,
        HttpStatus.FORBIDDEN,
      );
    }
    try {
      await this.devicesReposity.update(deviceFound.id, {
        ...deviceFound,
        ...Dto,
      });
      return { result: 'Thành công' };
    } catch (error) {
      return { result: error.message };
    }
  }
  async deleteDevice(
    deviceId: string,
    customerId: string,
  ): Promise<{ result: string }> {
    // Tìm khách hàng dựa trên customerId
    const customer = await this.customersReposity.findOne({
      where: { customer_id: customerId },
      relations: ['devices'],
    });

    // Tìm thiết bị dựa trên deviceId
    const device = await this.devicesReposity.findOne({
      where: { deviceId: deviceId },
      relations: ['customers'],
    });

    if (!customer) {
      throw new HttpException(
        'Không tìm thấy khách hàng',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!device) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.FORBIDDEN);
    }

    // Lọc thiết bị ra khỏi danh sách thiết bị của khách hàng
    customer.devices = customer.devices.filter(
      (dev) => dev.deviceId !== deviceId,
    );
    await this.customersReposity.save(customer);

    // Lọc khách hàng ra khỏi danh sách khách hàng của thiết bị
    device.customers = device.customers.filter(
      (cust) => cust.customer_id !== customerId,
    );
    await this.devicesReposity.save(device);

    // Xóa mối quan hệ giữa khách hàng và thiết bị
    await this.devicesReposity
      .createQueryBuilder()
      .relation(DevicesEntity, 'customers')
      .of(device)
      .remove(customer);

    return { result: 'Thành công' };
  }
  async toggleAlarmStatus(
    deviceId: string,
    customerId: string,
  ): Promise<{ result: string }> {
    // Tìm khách hàng dựa trên customerId
    const customer = await this.customersReposity.findOne({
      where: { customer_id: customerId },
      relations: ['devices'],
    });

    if (!customer) {
      throw new HttpException(
        'Không tìm thấy khách hàng',
        HttpStatus.FORBIDDEN,
      );
    }

    // Tìm thiết bị dựa trên deviceId và đảm bảo rằng nó thuộc về khách hàng hiện tại
    const device = await this.devicesReposity.findOne({
      where: { deviceId: deviceId, customers: { id: customer.id } },
      relations: ['customers'],
    });

    if (!device) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.FORBIDDEN);
    }

    device.AlarmReport = device.AlarmReport === 1 ? 0 : 1;
    await this.devicesReposity.save(device);

    return { result: 'Thành công' };
  }
}
