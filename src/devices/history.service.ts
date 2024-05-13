import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToInstance } from 'class-transformer';
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
import { DevicesDto } from './dto/devices.dto';

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

  async Get(
    deviceId?: string,
    customer_id?: string,
  ): Promise<{ historyList: Array<HistoryDto>; historyCount: number }> {
    const qb = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.device', 'devices')
      .leftJoinAndSelect('devices.customers', 'customers')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim');

    // Execute the query and count
    const historyList = await qb.getMany();

    // Map to DTOs
    const historyDtoArray = historyList
      .filter((history) => {
        const isDevice = deviceId
          ? history.device?.deviceId === deviceId
          : true;
        const isCustomerId = customer_id
          ? history.device?.customers.some(
              (customer) => customer?.customer_id === customer_id,
            )
          : true;
        return isDevice && isCustomerId;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((history) => {
        return {
          ...plainToInstance(
            HistoryDto,
            {
              ...history,
              sensors: plainToInstance(SensorsDto, history.sensors, {
                excludeExtraneousValues: true,
              }),
              battery: plainToInstance(BatteryDto, history.battery, {
                excludeExtraneousValues: true,
              }),
              sim: plainToInstance(SimDto, history.sim, {
                excludeExtraneousValues: true,
              }),
              signal: plainToInstance(SignalDto, {
                ...history.signal,
              }),
            },
            {
              excludeExtraneousValues: true,
            },
          ),

          device: plainToInstance(DevicesDto, history.device, {
            excludeExtraneousValues: true,
          }),
        };
      });

    // Return results
    return {
      historyList: historyDtoArray,
      historyCount: historyDtoArray.length,
    };
  }
}
