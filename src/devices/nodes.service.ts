import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { DevicesEntity } from './entities/devices.entity';
import { CustomersEntity } from 'src/customers/customers.entity';
import { SensorsEntity } from './entities/sensors.entity';
import { SignalEntity } from './entities/signal.entity';
import { BatteryEntity } from './entities/battery.entity';
import { SimEntity } from './entities/sim.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { Room } from 'src/room/room.entity';
import { MqttService } from 'src/mqtt';
import { nodeType } from 'types/type';
import { HistoryEntity } from './entities/history.entity';
import { WarningLogsEntity } from './entities/warningLogs.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { MailService } from 'src/mail/mail.service';
import { NodesEntity } from './entities/nodes.entity';
import { NodesDto } from './dto/nodes.dto';
import { NodeHistoryEntity } from './entities/nodeHistory.entity';
import { HistoryDto } from './dto/history.dto';
import { SensorsDto } from './dto/sensors.dto';
import { BatteryDto } from './dto/battery.dto';
import { DevicesService } from './devices.service';

@Injectable()
export class NodeServices extends MysqlBaseService<NodesEntity, NodesDto> {
  constructor(
    private readonly dataSource: DataSource, // Inject or pass DataSource
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    @InjectRepository(NodesEntity)
    private readonly nodesReposity: Repository<NodesEntity>,
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
    @InjectRepository(NodeHistoryEntity)
    private readonly nodeHistoryRepository: Repository<NodeHistoryEntity>,
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
    @Inject(forwardRef(() => DevicesService))
    private readonly deviceService: DevicesService,
  ) {
    super(nodesReposity, NodesDto);
  }
  async processNode(node: nodeType, deviceFound: DevicesEntity): Promise<void> {
    try {
      if (!node?.nodeId) {
        this.logger.error('nodeId không hợp lệ');
        return;
      }

      const nodeFound = deviceFound.nodes?.find(
        (val) => val.nodeId === node.nodeId,
      );

      const nodeEntity =
        nodeFound ||
        (await this.nodesReposity
          .createQueryBuilder('nodes')
          .leftJoinAndSelect('nodes.device', 'device')
          .leftJoinAndSelect('nodes.history', 'nodeHistory')
          .leftJoinAndSelect('nodeHistory.sensors', 'sensors')
          .leftJoinAndSelect('nodeHistory.battery', 'battery')
          .where('nodes.nodeId = :nodeId', { nodeId: node.nodeId })
          .getOne());

      if (!nodeEntity) {
        this.logger.error(
          `Node ${node.nodeId} chưa được khởi tạo trên hệ thống`,
        );
        return;
      }

      if (!nodeFound && nodeEntity.device) {
        this.logger.error(
          `Node ${node.nodeId} đã được kết nối với một station`,
        );
        return;
      }

      // Prepare history data
      const sensorsHistory = await this.sensorsReposity.save(
        node.sensors as SensorsEntity,
      );
      const batteryHistory = await this.batteryReposity.save({
        voltage: node.battery,
      } as BatteryEntity);
      const historyNode = await this.nodeHistoryRepository.save({
        sensors: sensorsHistory,
        battery: batteryHistory,
      } as NodeHistoryEntity);
      nodeEntity.history = nodeEntity.history || [];
      nodeEntity.history.push(historyNode);
      nodeEntity.AlarmSatus = historyNode.sensors.AlarmSatus;
      if (historyNode.sensors.AlarmSatus) {
        const warningLogs = await this.warningLogsRepository.save({
          message: `Cảnh báo cháy ở node ${nodeEntity.nodeId} với thiết bị ${deviceFound.deviceName} có mã thiết bị ${deviceFound.deviceId}`,
        } as WarningLogsEntity);
        deviceFound.warningLogs = deviceFound.warningLogs || [];
        deviceFound.warningLogs.push(warningLogs);
        deviceFound.AlarmReport = 1;
        await this.devicesReposity.save(deviceFound);
        await this.deviceService.sendWarning(deviceFound.deviceId);
      }

      if (!nodeFound) {
        deviceFound.nodes = deviceFound.nodes || [];
        deviceFound.nodes.push(nodeEntity);
        await this.devicesReposity.save(deviceFound);
        this.logger.log(
          `Đã thêm node ${node.nodeId} vào station ${deviceFound.deviceId}`,
        );
      }
      const nodeSaved = await this.nodesReposity.save(nodeEntity);
      const latestHistory = nodeSaved.history.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      await Promise.all([
        this.chatGateWay.sendNodeDataToRoom(
          deviceFound.deviceId,
          node.nodeId,
          JSON.stringify({
            type: 'node',
            message: {
              deviceId: deviceFound.deviceId,
              nodeId: node.nodeId,
              ...latestHistory,
            },
          }),
        ),
      ]);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật node ${node.nodeId}: ${error.message}`,
      );
    }
  }
  async createNode(Dto: NodesDto): Promise<NodesDto> {
    try {
      const nodeId = `node_${this.generateUniqueId()}`;

      // Save device with generated keys
      const node = await this.nodesReposity.save({
        ...Dto,
        nodeId,
      });

      // Save room associated with the device
      const room = await this.roomReposity.save({
        title: `Room của thiết bị ${node.nodeId}`,
        description: `Room này để nhận dữ liệu`,
        type: `message-node`,
      });
      const roomHistoryLogger = await this.roomReposity.save({
        title: `Room của thiết bị ${node.nodeId}`,
        description: `Room này để nhận dữ liệu`,
        type: `message-historyLogger`,
      });
      // Associate room with the device and update the device entry
      node.room = room;
      node.historyLoggerRoom = roomHistoryLogger;
      const nodeSaved = await this.nodesReposity.save(node);
      return plainToInstance(NodesDto, nodeSaved, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error occurred while saving device:', error);
      throw new Error('Failed to save device');
    }
  }
  async addNodeinDevice(
    device: DevicesEntity,
    nodeId: string,
  ): Promise<NodesDto> {
    try {
      // Start a transaction
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Check if the node already exists
        let node = await queryRunner.manager
          .getRepository(NodesEntity)
          .findOne({ where: { nodeId } });

        node.device = { id: device.deviceId } as DevicesEntity;

        // Save the node
        node = await queryRunner.manager.getRepository(NodesEntity).save(node);

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Convert the entity to DTO and return
        return plainToInstance(NodesDto, node);
      } catch (error) {
        // Rollback the transaction on error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    } catch (error) {
      // Log the error
      this.logger.error(`Failed to add node: ${error.message}`, error.stack);

      // Throw a formatted HTTP exception
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add node',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getNodeinDevice(deviceId: string): Promise<{
    nodeList: Array<NodesDto>;
    nodeCount: number;
  }> {
    const deviceFound = await this.devicesReposity
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.nodes', 'nodes')
      .leftJoinAndSelect('nodes.history', 'history')
      .leftJoinAndSelect('nodes.historyLoggerRoom', 'historyLoggerRoom')
      .leftJoinAndSelect('nodes.room', 'room')
      .leftJoinAndSelect('history.sensors', 'sensors')
      .leftJoinAndSelect('history.battery', 'battery')
      .where('device.deviceId = :deviceId', { deviceId })
      .getOne();

    if (!deviceFound) {
      throw new HttpException('Không tìm thấy thiết bị', HttpStatus.NOT_FOUND);
    }

    if (!deviceFound.nodes || deviceFound.nodes.length === 0) {
      throw new HttpException(
        'Thiết bị không có node nào',
        HttpStatus.NOT_FOUND,
      );
    }
    const nodesDtoArray = deviceFound.nodes.map((node) => {
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
          deviceId: deviceFound.deviceId ?? null, // Dùng null thay vì ''
          roomId: node?.room.id ?? null,
          roomHistoryLoggerId: node?.historyLoggerRoom?.id ?? null,
        },
        { excludeExtraneousValues: true },
      );
    });
    return { nodeList: nodesDtoArray, nodeCount: nodesDtoArray.length };
  }
}
