import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { DevicesEntity } from './entities/devices.entity';
import { DevicesDto } from './dto/devices.dto';
import { CustomersEntity } from 'src/customers/customers.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { SignalEntity } from './entities/signal.entity';
import { BatteryEntity } from './entities/battery.entity';
import { SimEntity } from './entities/sim.entity';
import { CustomersDto } from 'src/customers/customers.dto';
import * as bcrypt from 'bcrypt';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { SimDto } from './dto/sim.dto';
import { SignalDto } from './dto/signal.dto';
import { HistoryDto } from './dto/history.dto';
import { UserEntity } from 'src/users/entity/user.entity';

@Injectable()
export class DevicesService extends MysqlBaseService<
  DevicesEntity,
  DevicesDto
> {
  constructor(
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    @InjectRepository(CustomersEntity)
    private readonly customersReposity: Repository<CustomersEntity>,
    @InjectRepository(SensorsEntity)
    private readonly sensorsReposity: Repository<SensorsEntity>,
    @InjectRepository(SignalEntity)
    private readonly signalReposity: Repository<SignalEntity>,
    @InjectRepository(BatteryEntity)
    private readonly batteryReposity: Repository<BatteryEntity>,
    @InjectRepository(SimEntity)
    private readonly simReposity: Repository<SimEntity>,
  ) {
    super(devicesReposity, DevicesDto);
  }
  generateUniqueId(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 6;
    let uniqueId = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters.charAt(randomIndex);
    }

    return uniqueId;
  }

  async findAll(
    query,
    customer_id: string = 'all',
  ): Promise<{ devices: Array<DevicesDto>; devicesCount: number }> {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customer', 'customers');
    qb.where('1 = 1');
    qb.orderBy('devices.createdAt', 'DESC'); // Corrected the alias to 'posts'
    qb.where('1 = 1');
    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }
    let deviceList = await qb.getMany();
    if (customer_id !== 'all') {
      deviceList = deviceList.filter((device) => {
        return device.customer?.customer_id === customer_id;
      });
    }
    const devicesDtoArray = deviceList.map((device) => {
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
      }
      return plainToClass(
        DevicesDto,
        {
          ...device,
          ...data,
          customer: device.customer
            ? plainToInstance(
                CustomersDto,
                {
                  ...device.customer,
                  fullName:
                    device.customer?.last_name ??
                    '' + device.customer?.first_name ??
                    '',
                },
                {
                  excludeExtraneousValues: true,
                },
              )
            : null,

          active: device.customer === null ? false : true,
        },
        { excludeExtraneousValues: true },
      );
    });

    return { devices: devicesDtoArray, devicesCount: devicesDtoArray.length };
  }
  async saveDevice(Dto: DevicesDto): Promise<{ result: string }> {
    try {
      await this.devicesReposity.save({
        ...Dto,
        secretKey: bcrypt.genSaltSync(10),
        deviceId: `device_${this.generateUniqueId()}`,
      });

      return { result: 'thành công' };
    } catch (error) {
      // Handle errors gracefully
      console.error('Error occurred while saving device:', error);
      throw new Error('Failed to save device');
    }
  }
}
