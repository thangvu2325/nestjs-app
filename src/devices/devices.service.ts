import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { DevicesEntity } from './entities/devices.entity';
import { DevicesDto } from './dto/devices.dto';
import { SensorsEntity } from './entities/sensors.entity';
import { BatteryEntity } from './entities/battery.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { SimDto } from './dto/sim.dto';
import { SignalDto } from './dto/signal.dto';
import { HistoryDto } from './dto/history.dto';
import { UserEntity } from 'src/users/entity/user.entity';
import { Room } from 'src/room/room.entity';
import { MqttService, Subscribe, Payload } from 'src/mqtt';
import { isJSON } from 'class-validator';
import { dataDeviceType, nodeType } from 'types/type';
import { HistoryEntity } from './entities/history.entity';
import { WarningLogsEntity } from './entities/warningLogs.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { UsersDto } from 'src/users/users.dto';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/mail/mail.service';
import { NodesEntity } from './entities/nodes.entity';
import { NodesDto } from './dto/nodes.dto';
import { NodeServices } from './nodes.service';

@Injectable()
export class DevicesService extends MysqlBaseService<
  DevicesEntity,
  DevicesDto
> {
  constructor(
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    @InjectRepository(NodesEntity)
    private readonly nodesReposity: Repository<NodesEntity>,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    @InjectRepository(SensorsEntity)
    private readonly sensorsReposity: Repository<SensorsEntity>,
    @InjectRepository(BatteryEntity)
    private readonly batteryReposity: Repository<BatteryEntity>,
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(Room)
    private readonly roomReposity: Repository<Room>,
    @InjectRepository(WarningLogsEntity)
    private readonly warningLogsRepository: Repository<WarningLogsEntity>,
    @Inject(MqttService)
    private readonly mqttService: MqttService,
    private readonly logger: Logger,
    private readonly chatGateWay: ChatGateway,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => NodeServices))
    private readonly nodeService: NodeServices,
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
            historyLast.sensors.AlarmSatus = 0;
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
  private async processDeviceHistory(
    deviceFound: DevicesEntity,
    history: HistoryDto,
    device: DevicesDto,
  ): Promise<void> {
    try {
      const sensorsHistory = await this.sensorsReposity.save(
        history.sensors as SensorsEntity,
      );
      const historyDevice = await this.historyRepository.save({
        sensors: sensorsHistory,
        logger: JSON.stringify(history),
      } as HistoryEntity);

      deviceFound.history = deviceFound.history || [];
      deviceFound.history.push(historyDevice);
      // console.log(deviceFound.nodes[0].history[0]);
      if (history?.sensors?.AlarmSatus) {
        const warningLogs = await this.warningLogsRepository.save({
          message: `Cảnh báo cháy với thiết bị ${deviceFound.deviceName} có mã thiết bị ${deviceFound.deviceId}`,
        } as WarningLogsEntity);
        deviceFound.warningLogs = deviceFound.warningLogs || [];
        deviceFound.warningLogs.push(warningLogs);
        deviceFound.AlarmReport = 1;
        await this.devicesReposity.save(deviceFound);
        await this.sendWarning(device.deviceId);
      }

      await this.devicesReposity.save(deviceFound);

      // Send updates to chat gateway
      const latestHistory = deviceFound.history.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];

      await Promise.all([
        this.chatGateWay.sendDeviceDataToRoom(
          device.deviceId,
          JSON.stringify({
            type: 'device',
            message: {
              deviceId: device.deviceId,
              ...latestHistory,
            },
          }),
        ),
        this.chatGateWay.sendLoggerDataToRoom(
          device.deviceId,
          JSON.stringify({
            type: 'historyLogger',
            message: {
              historyId: historyDevice.id,
              createdAt: historyDevice.createdAt,
              updatedAt: historyDevice.updatedAt,
              deletedAt: historyDevice.deletedAt,
              logger: historyDevice.logger,
            },
          }),
        ),
      ]);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật device history: ${error.message}`);
    }
  }

  // MQTT
  @Subscribe({
    topic: 'device',
    transform: (payload) => payload.toString(),
  })
  async garageDevice(@Payload() payload: string): Promise<void> {
    if (!isJSON(payload)) {
      this.logger.error('Dữ liệu không hợp lệ');
      return;
    }

    const data: dataDeviceType = JSON.parse(payload);
    if (!Array.isArray(data) || !data.length) {
      return;
    }

    const device: DevicesDto = {} as DevicesDto;
    const history: HistoryDto = {} as HistoryDto;
    let nodeList: nodeType[] = [];

    // Process payload data
    data.forEach((obj) => {
      switch (obj.testId) {
        case 'STATION':
          device.deviceId = obj.details.deviceId;
          break;
        case 'SENSOR':
          history.sensors = obj.details as SensorsDto;
          break;
        case 'NODELIST':
          nodeList = obj.details.nodeList;
          break;
      }
    });

    if (!device.deviceId) {
      this.logger.error('Không tìm thấy deviceId');
      return;
    }

    // Fetch device with related entities
    const deviceFound = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.nodes', 'nodes')
      .leftJoinAndSelect('nodes.history', 'nodeHistory')
      .leftJoinAndSelect('nodeHistory.sensors', 'nodeSensors')
      .leftJoinAndSelect('nodeHistory.battery', 'nodeBattery')
      .leftJoinAndSelect('devices.warningLogs', 'warningLogs')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .leftJoinAndSelect('history.signal', 'signal')
      .leftJoinAndSelect('history.sim', 'sim')
      .leftJoinAndSelect('devices.customers', 'customers')
      .where('devices.deviceId = :deviceId', { deviceId: device.deviceId })
      .getOne();

    if (!deviceFound) {
      this.logger.log(`Device not found with id: ${device.deviceId}`);
      return;
    }

    // Process nodes concurrently
    await Promise.all(
      nodeList.map((node) => this.nodeService.processNode(node, deviceFound)),
    );

    // Process device history
    await this.processDeviceHistory(deviceFound, history, device);
  }
  // testMQTTT(@Payload() payload) {
  //   this.mqttService.publish('test2', payload);
  // }

  async sendWarning(deviceId) {
    const warningUser = this.sendWarningUserList.find(
      (user) => user.deviceId === deviceId,
    );
    if (!warningUser) {
      this.sendWarningUserList.push({ deviceId, status: 'idle' });
      this.logger.warn('Warning: Chức năng gửi cảnh báo đang bắt đầu gửi.');
    } else if (warningUser.status === 'running') {
      this.logger.verbose(
        `Warning: Chức năng gửi cảnh báo đến ${deviceId} đang chạy.`,
      );
      return;
    } else if (warningUser.status === 'pause') {
      this.logger.fatal('Warning: sendWarning function is already pause.');
      return;
    } else if (warningUser.status === 'idle') {
      warningUser.status = 'running';
      this.logger.log('Warning: Chức năng gửi cảnh báo đang bắt đầu gửi.');
    }
    try {
      let AlarmTimeout;
      const checkAlarmStatus = async () => {
        try {
          const device = await this.devicesReposity
            .createQueryBuilder('devices')
            .leftJoinAndSelect('devices.nodes', 'nodes')
            .leftJoinAndSelect('nodes.history', 'nodeHistory')
            .leftJoinAndSelect('nodeHistory.sensors', 'nodeSensors')
            .leftJoinAndSelect('nodeHistory.battery', 'nodeBattery')
            .leftJoinAndSelect('devices.history', 'history')
            .leftJoinAndSelect('history.sensors', 'sensors')
            .leftJoinAndSelect('history.battery', 'battery')
            .leftJoinAndSelect('devices.owner', 'owner')
            .leftJoinAndSelect('devices.customers', 'customers')
            .where('devices.deviceId = :deviceId', { deviceId })
            .getOne();

          if (!device || !device.history || device.history.length === 0) {
            throw new Error(
              `Device history not found for deviceId: ${deviceId}`,
            );
          }
          if (device.AlarmReport === 0) {
            setTimeout(async () => {
              device.AlarmReport = 1;
              const historyLast = device.history.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
              )[0];
              historyLast.sensors.AlarmSatus = 0;
              await this.historyRepository.save(historyLast);
              await this.devicesReposity.save(device);
              await this.chatGateWay.sendDeviceDataToRoom(
                device.deviceId,
                JSON.stringify({
                  type: 'device',
                  message: {
                    deviceId: device?.deviceId,
                    ...historyLast, // Assuming historyLast is an object containing relevant data
                    sensors: {
                      ...historyLast.sensors, // Spread previous sensors properties
                      AlarmSatus: false, // Add or overwrite alarmStatus property
                    },
                    AlarmReport: 1,
                  },
                }),
              );
              this.logger.log(
                'Warning: Dừng cảnh báo do không phát hiện cháy.',
              );
              const warningUser = this.sendWarningUserList.find(
                (user) => user.deviceId === deviceId,
              );
              warningUser.status = 'idle';
              clearTimeout(AlarmTimeout);
            }, 15000);
            return;
          }
          const historyLast = device.history.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0];
          const isNodeAlarm = device.nodes.some(
            (item) => item.AlarmSatus === 1,
          );
          const isAlarm = isNodeAlarm || historyLast.sensors.AlarmSatus;
          if (isAlarm) {
            // Thực hiện hành động cảnh báo ở đây
            // Ví dụ: Gửi email, thông báo, hoặc thực hiện các hành động khẩn cấp khác
            device.AlarmReport === 1;
            await this.devicesReposity.save(device);
            this.logger.warn('Warning: Alarm status detected!');
            const warningUser = this.sendWarningUserList.find(
              (user) => user.deviceId === deviceId,
            );
            if (device.owner) {
              try {
                const userFound = await this.userReposity.findOne({
                  where: {
                    email: device.owner.email,
                  },
                });
                const userDto = plainToInstance(UsersDto, userFound, {
                  excludeExtraneousValues: true,
                });
                await this.mailService.sendEmailWarning(device.owner.email);
                await this.notificationService.sendPush(
                  userDto,
                  'Cảnh báo cháy',
                  `Phát hiện cháy tại thiết bị ${device.deviceName} có id là ${device.deviceId}`,
                );
              } catch (error) {
                this.logger.warn(error.message);
              }
            }
            device.customers.forEach(async (customer) => {
              try {
                const userFound = await this.userReposity.findOne({
                  where: {
                    email: customer.email,
                  },
                });
                const userDto = plainToInstance(UsersDto, userFound, {
                  excludeExtraneousValues: true,
                });
                await this.mailService.sendEmailWarning(customer.email);
                await this.notificationService.sendPush(
                  userDto,
                  'Cảnh báo cháy',
                  `Phát hiện cháy tại thiết bị ${device.deviceName} có id là ${device.deviceId}`,
                );
              } catch (error) {
                this.logger.warn(error.message);
              }
            });

            warningUser.status = 'running';
            AlarmTimeout = setTimeout(
              checkAlarmStatus,
              Number(process.env.WARNING_CYCLE),
            );
          } else {
            const warningUser = this.sendWarningUserList.find(
              (user) => user.deviceId === deviceId,
            );
            this.logger.log('Warning: Dừng cảnh báo do không phát hiện cháy.');

            warningUser.status = 'idle';
            clearTimeout(AlarmTimeout);
          }
        } catch (error) {
          this.logger.warn(`Error checking alarm status: ${error.message}`);
        }
      };
      checkAlarmStatus();
    } catch (error) {
      this.logger.warn(`Error sending warning: ${error.message}`);
      // Xử lý lỗi ở đây, chẳng hạn như gửi thông báo lỗi
    }
  }
  testMQTT() {
    this.mqttService.publish('test', { message: 'test 1' });
  }

  // End MQTT
  async findAllNodes(
    query,
  ): Promise<{ nodeList: Array<NodesDto>; nodeCount: number }> {
    try {
      const qb = this.nodesReposity
        .createQueryBuilder('nodes')
        .leftJoinAndSelect('nodes.device', 'device')
        .leftJoinAndSelect('nodes.history', 'nodeHistory')
        .leftJoinAndSelect('nodes.historyLoggerRoom', 'historyLoggerRoom')
        .leftJoinAndSelect('nodeHistory.sensors', 'sensors')
        .leftJoinAndSelect('nodeHistory.battery', 'battery')
        .where('1 = 1')
        .orderBy('nodes.createdAt', 'DESC'); // Sửa alias thành nodes nếu cần

      // Xác thực phân trang
      if (
        'limit' in query &&
        Number.isInteger(query.limit) &&
        query.limit > 0
      ) {
        qb.limit(query.limit);
      }
      if (
        'offset' in query &&
        Number.isInteger(query.offset) &&
        query.offset >= 0
      ) {
        qb.offset(query.offset);
      }
      const nodeList = await qb.getMany();
      const nodesDtoArray = nodeList.map((node) => {
        const historyLast = node?.history?.sort(
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
          } as HistoryDto;
        } else {
          data = {} as HistoryDto;
        }
        return plainToClass(
          NodesDto,
          {
            ...node,
            ...data,
            deviceId: node.device?.deviceId ?? null, // Dùng null thay vì ''
            roomHistoryLoggerId: node?.historyLoggerRoom?.id ?? null,
          },
          { excludeExtraneousValues: true },
        );
      });
      return { nodeList: nodesDtoArray, nodeCount: nodesDtoArray.length };
    } catch (error) {
      this.logger.error(`Lỗi khi truy vấn danh sách node: ${error.message}`);
      throw new Error('Không thể lấy danh sách node');
    }
  }

  async findAll(query, customer_id: string = 'all', deviceId?: string) {
    const qb = await this.devicesReposity
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.history', 'history')
      .leftJoinAndSelect('devices.nodes', 'nodes')
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
    const devicesDtoArray = deviceList
      .filter((item) => {
        if (deviceId) {
          return item.deviceId.includes(deviceId);
        }
        return true;
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
        return plainToClass(
          DevicesDto,
          {
            ...device,
            ...data,
            nodes: device.nodes.map((node) => {
              return plainToInstance(NodesDto, node, {
                excludeExtraneousValues: true,
              });
            }),
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
        nodes: null,
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
