import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { DevicesEntity } from './entities/devices.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { SignalEntity } from './entities/signal.entity';
import { BatteryEntity } from './entities/battery.entity';
import { SimEntity } from './entities/sim.entity';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { SimDto } from './dto/sim.dto';
import { SignalDto } from './dto/signal.dto';
import { HistoryEntity } from './entities/history.entity';
import { HistoryDto } from './dto/history.dto';

@Injectable()
export class HistoryService extends MysqlBaseService<
  HistoryEntity,
  HistoryDto
> {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(DevicesEntity)
    private readonly deviceRepository: Repository<DevicesEntity>,
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
    super(historyRepository, HistoryDto);
  }

  async findOneByDeviceId(
    query,
    deviceId: string,
  ): Promise<{ historyList: Array<HistoryDto>; historyCount: number }> {
    const DeviceFound = await this.deviceRepository
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.customer', 'customers')
      .where('devices.deviceId = :deviceId', { deviceId })
      .getOne();
    if (!DeviceFound) {
      throw 'Không tìm thấy thiết bị';
    }
    const qb = this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .where('history.deviceId = :deviceId', { deviceId: DeviceFound.id });
    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }
    const historyList = await qb.getMany();
    const historyCount = await qb.getCount();
    const historyDtoArray = historyList.map((device) => {
      return plainToClass(
        HistoryDto,
        {
          ...device,
          sensors: plainToInstance(SensorsDto, device.sensors, {
            excludeExtraneousValues: true,
          }),
          battery: plainToInstance(BatteryDto, device.battery, {
            excludeExtraneousValues: true,
          }),
          sim: plainToInstance(SimDto, device.sim, {
            excludeExtraneousValues: true,
          }),
          signal: plainToInstance(SignalDto, {
            ...device.signal,
          }),
        },
        {
          excludeExtraneousValues: true,
        },
      );
    });

    return { historyList: historyDtoArray, historyCount: historyCount };
  }
}
