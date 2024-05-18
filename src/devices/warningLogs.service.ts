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
import { DevicesDto } from './dto/devices.dto';
import { WarningLogsEntity } from './entities/warningLogs.entity';
import { WarningLogsDto } from './dto/warningLogs.dto';

@Injectable()
export class WarningLogsService extends MysqlBaseService<
  WarningLogsEntity,
  WarningLogsDto
> {
  constructor(
    @InjectRepository(WarningLogsEntity)
    private readonly warningLogsRepository: Repository<WarningLogsEntity>,
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
    super(warningLogsRepository, WarningLogsDto);
  }

  async Get(
    deviceId?: string,
    customer_id?: string,
  ): Promise<{
    warningLogsList: Array<WarningLogsDto>;
    warningLogsCount: number;
  }> {
    const qb = await this.warningLogsRepository
      .createQueryBuilder('warningLogs')
      .leftJoinAndSelect('warningLogs.device', 'devices')
      .leftJoinAndSelect('devices.customers', 'customers');

    // Execute the query and count
    const warningLogsList = await qb.getMany();

    // Map to DTOs
    const warningLogsDtoArray = warningLogsList
      .filter((warningLogs) => {
        const isDevice = deviceId
          ? warningLogs.device?.deviceId === deviceId
          : true;
        const isCustomerId = customer_id
          ? warningLogs.device?.customers.some(
              (customer) => customer?.customer_id === customer_id,
            )
          : true;
        return isDevice && isCustomerId;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((warningLogs) => {
        return {
          ...plainToInstance(WarningLogsDto, warningLogs, {
            excludeExtraneousValues: true,
          }),
          device: plainToInstance(DevicesDto, warningLogs.device, {
            excludeExtraneousValues: true,
          }),
        };
      });

    // Return results
    return {
      warningLogsList: warningLogsDtoArray,
      warningLogsCount: warningLogsDtoArray.length,
    };
  }
}
