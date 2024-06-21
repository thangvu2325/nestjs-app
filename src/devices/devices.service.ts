import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { Cron, CronExpression } from '@nestjs/schedule';
import { SimEntity } from './entities/sim.entity';
import * as bcrypt from 'bcrypt';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { SimDto } from './dto/sim.dto';
import { SignalDto } from './dto/signal.dto';
import { HistoryDto } from './dto/history.dto';
import { UserEntity } from 'src/users/entity/user.entity';
import { Room } from 'src/room/room.entity';

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
    @InjectRepository(Room)
    private readonly roomReposity: Repository<Room>,
  ) {
    super(devicesReposity, DevicesDto);
  }
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    try {
      const entities = await this.devicesReposity
        .createQueryBuilder('devices')
        .leftJoinAndSelect('devices.history', 'history')
        .leftJoinAndSelect('history.sensors', 'sensors')
        .getMany();

      const filteredEntities = entities.filter((device) => {
        const historyLast = device?.history?.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0];

        if (historyLast) {
          return !device.AlarmReport || historyLast.sensors.AlarmSatus;
        }
        return !device.AlarmReport;
      });

      for (const entity of filteredEntities) {
        const timeDiff =
          (new Date().getTime() - new Date(entity.createdAt).getTime()) / 1000;
        if (timeDiff >= 30) {
          const historyLast = entity?.history?.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0];

          if (historyLast && historyLast.sensors.AlarmSatus) {
            historyLast.sensors.AlarmSatus = false;
            await this.sensorsReposity.save(historyLast.sensors);
          }
          entity.AlarmReport = 1;
          await this.devicesReposity.save(entity);

          console.log(`Updated entity with id ${entity.id}`);
        }
      }
    } catch (error) {
      console.error('Error in handleCron:', error);
    }
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

  async findAll(query, customer_id: string = 'all') {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.owner', 'owner')
      .leftJoinAndSelect('owner.myDevice', 'myDevice')
      .leftJoinAndSelect('devices.room', 'room')
      .leftJoinAndSelect('devices.historyLoggerRoom', 'historyLoggerRoom')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers');
    qb.where('1 = 1');
    qb.orderBy('devices.createdAt', 'DESC'); // Corrected the alias to 'posts'
    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }
    const deviceList = await qb.getMany();
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
      } else {
        data = {} as HistoryDto;
      }
      return plainToClass(
        DevicesDto,
        {
          ...device,
          ...data,
          ownerId: device.owner?.customer_id,
          roomId: device?.room?.id ?? null,
          roomHistoryLoggerId: device?.historyLoggerRoom?.id ?? null,
          active: device.owner?.customer_id ? true : false,
          customer_id: device.customers
            .map((cus) => {
              return cus.customer_id;
            })
            .join('|'),
          role:
            customer_id !== 'all'
              ? device?.owner?.customer_id === customer_id
                ? 'owner'
                : 'member'
              : undefined,
        },
        { excludeExtraneousValues: true },
      );
    });

    return { devices: devicesDtoArray, devicesCount: devicesDtoArray.length };
  }

  async saveDevice(Dto: DevicesDto): Promise<DevicesDto> {
    try {
      // Generate secret key and device ID
      const secretKey = bcrypt.genSaltSync(10);
      const deviceId = `device_${this.generateUniqueId()}`;

      // Save device with generated keys
      const devices = await this.devicesReposity.save({
        ...Dto,
        secretKey,
        deviceId,
      });

      // Save room associated with the device
      const room = await this.roomReposity.save({
        title: `Room của thiết bị ${devices.deviceId}`,
        description: `Room này để nhận dữ liệu`,
        type: `message-device`,
      });
      const roomHistoryLogger = await this.roomReposity.save({
        title: `Room của thiết bị ${devices.deviceId}`,
        description: `Room này để nhận dữ liệu`,
        type: `message-historyLogger`,
      });
      // Associate room with the device and update the device entry
      devices.room = room;
      devices.historyLoggerRoom = roomHistoryLogger;
      const device = await this.devicesReposity.save(devices);
      return plainToInstance(DevicesDto, device, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error occurred while saving device:', error);
      throw new Error('Failed to save device');
    }
  }
  async updateDevice(id: string, deviceId: string) {
    const roomFound = await this.roomReposity.findOne({
      where: {
        id,
      },
    });
    const deviceFound = await this.devicesReposity.findOne({
      where: { deviceId },
      relations: ['room'],
    });
    deviceFound.room = roomFound;
    await this.devicesReposity.save(deviceFound);
    return { result: 'thành công' };
  }
  async GetDeviceById(deviceId: string) {
    const deviceFound = await this.devicesReposity.findOne({
      where: { deviceId },
      relations: ['room', 'historyLoggerRoom'],
    });
    if (!deviceFound) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.FORBIDDEN);
    }
    return plainToInstance(
      DevicesDto,
      {
        ...deviceFound,
        roomId: deviceFound?.room?.id ?? null,
        roomHistoryLoggerId: deviceFound?.historyLoggerRoom?.id ?? null,
      },
      { excludeExtraneousValues: true },
    );
  }
  async updateHistoryRoom() {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.owner', 'owner')
      .leftJoinAndSelect('owner.myDevice', 'myDevice')
      .leftJoinAndSelect('devices.room', 'room')
      .leftJoinAndSelect('devices.historyLoggerRoom', 'historyLoggerRoom')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers');
    qb.where('1 = 1');

    const deviceList = await qb.getMany();
    const devicesDtoArray = deviceList.map(async (device) => {
      const roomHistoryLogger = await this.roomReposity.save({
        title: `Room của thiết bị ${device.deviceId}`,
        description: `Room này để nhận dữ liệu`,
        type: `message-historyLogger`,
      });
      device.historyLoggerRoom = roomHistoryLogger;
      device = await this.devicesReposity.save(device);
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
          ownerId: device.owner?.customer_id,
          roomId: device?.room?.id ?? null,
          roomHistoryLoggerId: device?.historyLoggerRoom?.id ?? null,
          active: device.owner?.customer_id ? true : false,
        },
        { excludeExtraneousValues: true },
      );
    });

    return { devices: devicesDtoArray, devicesCount: devicesDtoArray.length };
  }
}
