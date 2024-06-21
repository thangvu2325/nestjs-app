import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { HistoryLoggerDto } from './dto/historyLogger.dto';
import { addHours, subDays } from 'date-fns';
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
  convertToHoChiMinhTime(date: Date): Date {
    return addHours(date, 7);
  }
  async Get(query: {
    customer_id?: string;
    deviceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ historyList: Array<HistoryDto>; historyCount: number }> {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 10));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    if (
      (startDate && isNaN(startDate.getTime())) ||
      (endDate && isNaN(endDate.getTime()))
    ) {
      throw new Error('Invalid date format');
    }
    const qb = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.device', 'devices')
      .leftJoinAndSelect('devices.customers', 'customers')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .where('history.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    // Execute the query and count
    const historyList = await qb.getMany();

    // Map to DTOs
    const historyDtoArray = historyList
      .filter((history) => {
        const isDevice = query.deviceId
          ? history.device?.deviceId === query.deviceId
          : true;
        const isCustomerId = query.customer_id
          ? history.device?.customers.some(
              (customer) => customer?.customer_id === query.customer_id,
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
  async GetRequest(query: {
    customer_id?: string;
    deviceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{ requestCount: number; time: Date }>> {
    const startDate = query.startDate
      ? this.convertToHoChiMinhTime(new Date(query.startDate))
      : subDays(this.convertToHoChiMinhTime(new Date()), 10); // Ngày trước đó 10 ngày tính từ ngày hôm nay
    const endDate = query.endDate
      ? this.convertToHoChiMinhTime(new Date(query.endDate))
      : this.convertToHoChiMinhTime(new Date()); // Ngày hiện tại
    const qb = await this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.device', 'devices')
      .leftJoinAndSelect('devices.customers', 'customers')
      .where('history.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    // Execute the query and count
    const historyList = await qb.getMany();

    // Map to DTOs
    const historyDtoArray = historyList
      .filter((history) => {
        const isDevice = query.deviceId
          ? history.device?.deviceId === query.deviceId
          : true;
        const isCustomerId = query.customer_id
          ? history.device?.customers.some(
              (customer) => customer?.customer_id === query.customer_id,
            )
          : true;
        return isDevice && isCustomerId;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const groupedByDate = historyDtoArray.reduce((acc, curr) => {
      // Lấy ngày tháng năm từ createAt và tạo thành chuỗi để sử dụng làm key
      const dateKey = this.convertToHoChiMinhTime(new Date(curr.createdAt))
        .toISOString()
        .split('T')[0];
      // Nếu chưa tồn tại key này trong accumulator, thêm vào với giá trị ban đầu
      if (!acc[dateKey]) {
        acc[dateKey] = {
          time: this.convertToHoChiMinhTime(new Date(curr.createdAt)),
          RequestCount: 0,
        };
      }

      // Tăng RequestCount cho ngày tương ứng
      acc[dateKey].RequestCount += 1;

      return acc;
    }, {});
    // Chuyển từ object sang array
    const result: Array<{ requestCount: number; time: Date }> =
      Object.values(groupedByDate);
    return result;
  }

  async GetHistoryLogger(
    deviceId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query?: {
      take?: string;
      skip?: string;
    },
  ) {
    const deviceFound = await this.deviceRepository.findOne({
      where: {
        deviceId,
      },
      relations: ['history'],
    });
    if (!deviceFound) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.FORBIDDEN);
    }
    return deviceFound.history
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .filter((his) => his.logger)
      .map((his) => {
        return plainToInstance(HistoryLoggerDto, {
          historyId: his.id,
          createdAt: his.createdAt,
          updatedAt: his.updatedAt,
          deletedAt: his.deletedAt,
          logger: his.logger,
        });
      });
  }
}
