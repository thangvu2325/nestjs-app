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
    const qb = await this.usersReposity
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .leftJoinAndSelect('customer.devices', 'devices')
      .where('1=1');
    qb.orderBy('user.createdAt', 'DESC'); // Corrected the alias to 'posts'
    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }
    const userList = await qb.getMany();

    const customersDtoArray = userList
      .filter((user) => user.role === 'User')
      .map((user) => {
        return plainToClass(
          CustomersDto,
          {
            ...{
              ...user.customer,
              fullName: user.customer.last_name + user.customer.first_name,
            },
          },
          { excludeExtraneousValues: true },
        );
      });

    return {
      customers: customersDtoArray,
      customersCount: customersDtoArray.length,
    };
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
  async addDevice(dto: DevicesDto, customerId: string) {
    // Find the customer by ID and load their devices
    const customer = await this.customersReposity.findOne({
      where: { customer_id: customerId },
      relations: ['devices', 'myDevice'],
    });

    // Check if the customer exists
    if (!customer) {
      throw new HttpException(
        'Không tìm thấy khách hàng',
        HttpStatus.FORBIDDEN,
      );
    }

    // Find the device by deviceId
    const device = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.owner', 'owner')
      .leftJoinAndSelect('devices.room', 'room')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers')
      .where('devices.deviceId = :deviceId', { deviceId: dto.deviceId })
      .getOne();

    // Check if the device exists
    if (!device) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.FORBIDDEN);
    }
    // Verify the secret key
    if (dto.type === 'owner') {
      if (device.secretKey !== dto.secretKey) {
        throw new HttpException('Mã bí mật không đúng', HttpStatus.FORBIDDEN);
      }
    } else {
      const keysFound = await this.keyAddDeviceReposity.find({
        where: { deviceId: device.deviceId, key: dto.secretKey },
      });

      if (!keysFound.length) {
        throw new HttpException('Mã bí mật không đúng', HttpStatus.FORBIDDEN);
      }

      const isKeyExpired = keysFound.some(
        (key) =>
          new Date(key.activeKeyExpiresAt).getTime() <= new Date().getTime(),
      );

      if (isKeyExpired) {
        throw new HttpException('Mã bí mật đã hết hạn', HttpStatus.FORBIDDEN);
      }
    }

    // Add the device to the customer's device list
    if (dto.type === 'owner') {
      if (!customer.myDevice) {
        customer.myDevice = [];
      }
      if (customer.myDevice.some((dev) => dev.deviceId === dto.deviceId)) {
        throw new HttpException('Thiết bị đã được thêm', HttpStatus.FORBIDDEN);
      }
      customer.myDevice.push(device);
      if (device.owner) {
        throw new HttpException(
          'Thiết bị đã được sử dụng',
          HttpStatus.FORBIDDEN,
        );
      }
      device.owner = customer;
    } else {
      if (!customer.devices) {
        customer.devices = [];
      }
      if (customer.devices.some((dev) => dev.deviceId === dto.deviceId)) {
        throw new HttpException('Thiết bị đã được thêm', HttpStatus.FORBIDDEN);
      }
      customer.devices.push(device);

      if (!device.customers) {
        device.customers = [];
      }
      if (device.customers.some((cus) => cus.customer_id === customerId)) {
        throw new HttpException(
          'Người dùng đã được thêm thiết bị này',
          HttpStatus.FORBIDDEN,
        );
      }
      device.customers.push(customer);
    }

    // Save the updated entities
    await this.customersReposity.save(customer);
    await this.devicesReposity.save(device);

    // Prepare the latest history data
    const historyLast = device?.history?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    let data: HistoryDto = {} as HistoryDto;
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
        signal: plainToInstance(SignalDto, { ...historyLast.signal }),
      } as HistoryDto;
    }

    // Return the device details
    return plainToClass(
      DevicesDto,
      {
        ...device,
        ...data,
        roomId: device?.room?.id ?? null,
        active: device.customers.length ? true : false,
        role: dto.type,
        customer_id: device.customers.map((cus) => cus.customer_id).join('|'),
      },
      { excludeExtraneousValues: true },
    );
  }
  async getAllDevice(customerId: string) {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.owner', 'owner')
      .leftJoinAndSelect('owner.myDevice', 'myDevice')
      .leftJoinAndSelect('devices.room', 'room')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers');
    const customerFound = await this.customersReposity.findOne({
      where: {
        customer_id: customerId,
      },
      relations: ['myDevice', 'devices', 'myDevice.room'],
    });
    if (!customerFound) {
      throw new HttpException(
        `Không tìm thấy khách hàng`,
        HttpStatus.FORBIDDEN,
      );
    }
    const deviceList = await qb.getMany();
    const deviceRes = deviceList
      .filter((device) => {
        if (device.owner?.customer_id === customerId) {
          return true;
        } else {
          return device.customers.some((customer) => {
            return customer.customer_id === customerId;
          });
        }
      })
      .map((device) => {
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
        return plainToInstance(
          DevicesDto,
          {
            ...device,
            ...data,
            roomId: device?.room?.id ?? null,
            customer_id: device.customers
              .map((cus) => {
                return cus.customer_id;
              })
              .join('|'),
            role:
              device?.owner?.customer_id === customerId ? 'owner' : 'member',
          },
          {
            excludeExtraneousValues: true,
          },
        );
      });
    return {
      devices: deviceRes,
      devicesCount: deviceRes.length,
    };
  }
  async createKeyAddDevice(userId: string, deviceId: string) {
    const userFound = await this.usersReposity.findOne({
      where: {
        id: userId,
      },
      relations: ['customer'],
    });
    if (!userFound) {
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
      activeKeyExpiresAt: new Date(Date.now() + 121 * 1000),
    });
    return keyAddDevice;
  }
  async updateDevice(Dto: DevicesDto, customer_id: string, deviceId: string) {
    // Fetch customer along with their devices
    const customerFound = await this.customersReposity
      .createQueryBuilder('customers')
      .leftJoinAndSelect('customers.myDevice', 'myDevice')
      .where('customers.customer_id = :customer_id', { customer_id })
      .getOne();

    // Check if customer exists
    if (!customerFound) {
      throw new HttpException(`Customer not found`, HttpStatus.FORBIDDEN);
    }

    // Check if device exists within customer's devices
    const deviceFound = customerFound.myDevice?.find(
      (device) => device.deviceId === deviceId,
    );

    if (!deviceFound) {
      throw new HttpException(
        `Customer with ID ${customer_id} does not have a device with ID ${deviceId}`,
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      // Update the found device with the new data
      const deviceUpdated = await this.devicesReposity.save({
        ...deviceFound,
        ...Dto,
      });

      // Return the updated device instance
      return plainToInstance(DevicesDto, deviceUpdated, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      // Handle errors during the save operation
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }
  async deleteDevice(
    deviceId: string,
    customerId: string,
  ): Promise<{ result: string }> {
    // Find the customer by customerId
    const customer = await this.customersReposity.findOne({
      where: { customer_id: customerId },
      relations: ['devices', 'myDevice'],
    });

    // Find the device by deviceId
    const device = await this.devicesReposity.findOne({
      where: { deviceId: deviceId },
      relations: ['customers', 'owner'],
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

    // Remove the device from the customer's myDevice list
    customer.myDevice = customer.myDevice.filter(
      (dev) => dev.deviceId !== deviceId,
    );

    // Remove the device from the customer's devices list
    customer.devices = customer.devices.filter(
      (dev) => dev.deviceId !== deviceId,
    );
    await this.customersReposity.save(customer);

    // Remove the customer from the device's owner if they are the owner
    if (device.owner && device.owner.customer_id === customerId) {
      device.owner = null;
    }

    // Remove the customer from the device's customers list
    device.customers = device.customers.filter(
      (cust) => cust.customer_id !== customerId,
    );
    await this.devicesReposity.save(device);

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
    const device = await this.devicesReposity.findOne({
      where: { deviceId: deviceId },
      relations: ['customers', 'owner', 'history'],
    });

    if (!device) {
      throw new HttpException(
        'Không tìm thấy khách hàng',
        HttpStatus.FORBIDDEN,
      );
    }

    device.AlarmReport = device.AlarmReport === 1 ? 0 : 1;
    await this.devicesReposity.save(device);
    return { result: 'Thành công' };
  }
}
