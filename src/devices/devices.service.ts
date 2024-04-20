import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { DevicesEntity } from './entities/devices.entity';
import { DevicesDto } from './dto/devices.dto';
import { CustomersEntity } from 'src/customers/customers.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { NetworkEntity } from './entities/network.entity';
import { SignalEntity } from './entities/signal.entity';
import { BatteryEntity } from './entities/battery.entity';
import { SimEntity } from './entities/sim.entity';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { SimDto } from './dto/sim.dto';
import { SignalDto } from './dto/signal.dto';
import { NetWorkDto } from './dto/network.dto';
import { CustomersDto } from 'src/customers/customers.dto';

@Injectable()
export class DevicesService extends MysqlBaseService<
  DevicesEntity,
  DevicesDto
> {
  constructor(
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    @InjectRepository(CustomersEntity)
    private readonly customersReposity: Repository<CustomersEntity>,
    @InjectRepository(SensorsEntity)
    private readonly sensorsReposity: Repository<SensorsEntity>,
    @InjectRepository(NetworkEntity)
    private readonly networkReposity: Repository<NetworkEntity>,
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
  ): Promise<{ devices: Array<DevicesDto>; devicesCount: number }> {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.sensors', 'sensors')
      .leftJoinAndSelect('devices.battery', 'battery')
      .leftJoinAndSelect('devices.signal', 'signal') // Join with the Signal entity
      .leftJoinAndSelect('signal.networkReport', 'network') // Join with the Network entity from Signal
      .leftJoinAndSelect('devices.sim', 'sim')
      .leftJoinAndSelect('devices.customer', 'customers');
    qb.where('1 = 1');

    qb.orderBy('devices.createdAt', 'DESC'); // Corrected the alias to 'posts'
    const devicesCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const deviceList = await qb.getMany();
    const devicesDtoArray = deviceList.map((device) => {
      return plainToClass(
        DevicesDto,
        {
          ...device,
          customer: plainToInstance(CustomersDto, device.customer, {
            excludeExtraneousValues: true,
          }),
          sensors: plainToInstance(SensorsDto, device.sensors, {
            excludeExtraneousValues: true,
          }),
          battery: plainToInstance(BatteryDto, device.battery, {
            excludeExtraneousValues: true,
          }),
          sim: plainToInstance(SimDto, device.sim, {
            excludeExtraneousValues: true,
          }),
          signal: plainToInstance(
            SignalDto,
            {
              ...device.signal,
              networkReport: plainToInstance(
                NetWorkDto,
                device.signal?.networkReport,
                {
                  excludeExtraneousValues: true,
                },
              ),
            },
            {
              excludeExtraneousValues: true,
            },
          ),
        },
        { excludeExtraneousValues: true },
      );
    });

    return { devices: devicesDtoArray, devicesCount };
  }
  async saveDevice(Dto: DevicesDto): Promise<{ result: string }> {
    try {
      const newBattery = await this.batteryReposity.save({} as BatteryEntity);
      const newSensor = await this.sensorsReposity.save({} as SensorsEntity);
      const newSim = await this.simReposity.save({} as SimEntity);
      const newNetwork = await this.networkReposity.save({} as NetworkEntity);
      const newSignal = await this.signalReposity.save({
        networkReport: newNetwork,
      } as SignalEntity);
      // Save the new device and await its completion
      await this.devicesReposity.save({
        ...Dto,
        deviceId: `device_${this.generateUniqueId()}`,
        battery: newBattery,
        sensors: newSensor,
        signal: newSignal,
        sim: newSim,
      });

      return { result: 'thành công' };
    } catch (error) {
      // Handle errors gracefully
      console.error('Error occurred while saving device:', error);
      throw new Error('Failed to save device');
    }
  }
}
