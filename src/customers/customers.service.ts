import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { CustomersEntity } from './customers.entity';
import { CustomersDto } from './customers.dto';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import * as bcrypt from 'bcrypt';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { CoapService } from 'src/coap/coap.service';
import { HistoryDto } from 'src/devices/dto/history.dto';
import { SensorsDto } from 'src/devices/dto/sensors.dto';
import { BatteryDto } from 'src/devices/dto/battery.dto';
import { SimDto } from 'src/devices/dto/sim.dto';
import { SignalDto } from 'src/devices/dto/signal.dto';
import { KeyAddDeviceEntity } from './keyAddDevice.entity';

@Injectable()
export class CustomersService extends MysqlBaseService<
  CustomersEntity,
  CustomersDto
> {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customersReposity: Repository<CustomersEntity>,
    @InjectRepository(KeyAddDeviceEntity)
    private readonly keyAddDeviceReposity: Repository<KeyAddDeviceEntity>,
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
    type: 'owner' | 'member' = 'member',
  ) {
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
    const device = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.room', 'room')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers')
      .where('devices.deviceId = :deviceId', {
        deviceId: dto.deviceId,
      })
      .getOne();

    // Kiểm tra xem thiết bị có tồn tại hay không
    if (!device) {
      throw new HttpException(`Không tìm thấy thiết bị`, HttpStatus.FORBIDDEN);
    }
    if (type === 'owner') {
      // Kiểm tra mã bí mật của thiết bị
      if (device.secretKey !== dto.secretKey) {
        throw new HttpException(`Mã bí mật không đúng`, HttpStatus.FORBIDDEN);
      }
    } else {
      const keyFound = await this.keyAddDeviceReposity.findOne({
        where: {
          deviceId: device.deviceId,
        },
      });

      if (keyFound.key !== dto.secretKey) {
        throw new HttpException(`Mã bí mật không đúng`, HttpStatus.FORBIDDEN);
      } else if (
        new Date(keyFound.activeKeyExpiresAt).getTime() <= new Date().getTime()
      ) {
        throw new HttpException(`Mã bí mật đã hết hạn`, HttpStatus.FORBIDDEN);
      }
    }

    if (!customer.devices) {
      customer.devices = []; // Khởi tạo mảng nếu chưa tồn tại
    }
    // Thêm thiết bị vào danh sách thiết bị của khách hàng

    const deviceExists = customer.devices.some(
      (device) => device.deviceId === dto.deviceId,
    );

    if (deviceExists) {
      throw new HttpException(`Thiết bị đã được thêm`, HttpStatus.FORBIDDEN);
    } else {
      customer.devices.push(device);
    }
    await this.customersReposity.save(customer);
    if (type === 'owner') {
      if (device.owner) {
        throw new HttpException(
          `Thiết bị đã được sử dụng`,
          HttpStatus.FORBIDDEN,
        );
      }
      device.owner = customer;
    } else {
      if (!device.customers) {
        device.customers = [];
      }
      const customerExists = device.customers.some(
        (cus) => cus.customer_id === customerId,
      );
      if (customerExists) {
        throw new HttpException(
          `Người dùng đã được thêm thiết bị này`,
          HttpStatus.FORBIDDEN,
        );
      } else {
        device.customers.push(customer);
      }
    }

    await this.devicesReposity.save(device);
    const historyLast = device?.history?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    let data = {} as HistoryDto;
    if (historyLast) {
      data = {
        sensors: plainToInstance(SensorsDto, historyLast.sensors, {
          excludeExtraneousValues: true,
        }),
        battery: plainToInstance(BatteryDto, historyLast.battery, {
          excludeExtraneousValues: true,
        }),
        sim: plainToInstance(SimDto, historyLast.sim, {
          excludeExtraneousValues: true,
        }),
        signal: plainToInstance(SignalDto, {
          ...historyLast.signal,
        }),
      } as HistoryDto;
    } else {
      data = {} as HistoryDto;
    }
    return plainToClass(
      DevicesDto,
      {
        ...device,
        ...data,
        roomId: device?.room?.id ?? null,
        active: device.customers.length ? true : false,
        customer_id: device.customers
          .map((cus) => {
            return cus.customer_id;
          })
          .join('|'),
      },
      { excludeExtraneousValues: true },
    );
  }

  async createKeyAddDevice(userId: string, deviceId: string) {
    const userFound = await this.usersReposity.findOne({
      where: {
        id: userId,
      },
      relations: ['customer'],
    });
    if (!userFound) {
      console.log(1);
      throw new HttpException(
        `Không tìm thấy người dùng`,
        HttpStatus.FORBIDDEN,
      );
    }
    const deviceFound = await this.devicesReposity.findOne({
      where: {
        deviceId,
      },
      relations: ['owner'],
    });
    if (!deviceFound) {
      console.log(2);

      throw new HttpException(`Không tìm thấy thiết bị`, HttpStatus.FORBIDDEN);
    }
    if (deviceFound.owner.customer_id !== userFound.customer.customer_id) {
      throw new HttpException(
        `Không có quyền chia sẽ thiết bị`,
        HttpStatus.FORBIDDEN,
      );
    }
    const secretKey = bcrypt.genSaltSync(10);
    const keyAddDevice = this.keyAddDeviceReposity.save({
      key: secretKey,
      deviceId: deviceFound.deviceId,
      activeKeyExpiresAt: new Date(Date.now() + 120 * 1000),
    });
    return keyAddDevice;
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
