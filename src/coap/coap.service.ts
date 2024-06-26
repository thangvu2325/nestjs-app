// coap.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isArray, isJSON } from 'class-validator';
import { createServer, request, updateTiming } from 'coap';
import { ChatGateway } from 'src/chat/chat.gateway';
// import { ChatGateway } from 'src/chat/chat.gateway';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesService } from 'src/devices/devices.service';
import { BatteryDto } from 'src/devices/dto/battery.dto';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import { HistoryDto } from 'src/devices/dto/history.dto';
import { SensorsDto } from 'src/devices/dto/sensors.dto';
import { SignalDto } from 'src/devices/dto/signal.dto';
import { SimDto } from 'src/devices/dto/sim.dto';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { HistoryEntity } from 'src/devices/entities/history.entity';
import { SensorsEntity } from 'src/devices/entities/sensors.entity';
import { SignalEntity } from 'src/devices/entities/signal.entity';
import { SimEntity } from 'src/devices/entities/sim.entity';
import { Repository } from 'typeorm';
import { DataCoapType } from 'types/type';
import { URL } from 'url';
import { NotificationService } from 'src/notification/notification.service';
import { UserEntity } from 'src/users/entity/user.entity';
import { plainToInstance } from 'class-transformer';
import { UsersDto } from 'src/users/users.dto';
import { WarningLogsEntity } from 'src/devices/entities/warningLogs.entity';
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class CoapService {
  private server: any;
  private PREVENT_CRASH = true;
  private observerRead: any;
  constructor(
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
    @InjectRepository(CustomersEntity)
    private readonly customersReposity: Repository<CustomersEntity>,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    @InjectRepository(SensorsEntity)
    private readonly sensorsReposity: Repository<SensorsEntity>,
    @InjectRepository(SignalEntity)
    private readonly signalReposity: Repository<SignalEntity>,
    @InjectRepository(BatteryEntity)
    private readonly batteryReposity: Repository<BatteryEntity>,
    @InjectRepository(SimEntity)
    private readonly simReposity: Repository<SimEntity>,
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(WarningLogsEntity)
    private readonly warningLogsRepository: Repository<WarningLogsEntity>,
    private readonly devicesServices: DevicesService,
    private readonly chatGateWay: ChatGateway,
    private readonly logger: Logger,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {
    updateTiming({
      ackTimeout: 0.2,
      ackRandomFactor: 1.0,
      maxRetransmit: 4,
      maxLatency: 0.3,
      piggybackReplyMs: 10,
    });
    this.server = createServer();
  }
  sendWarningUserList = [] as Array<{
    deviceId: string;
    status: 'running' | 'pause' | 'idle';
  }>;
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
            .leftJoinAndSelect('devices.history', 'history')
            .leftJoinAndSelect('history.sensors', 'sensors')
            .leftJoinAndSelect('history.battery', 'battery')
            .leftJoinAndSelect('history.signal', 'signal')
            .leftJoinAndSelect('history.sim', 'sim')
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
              historyLast.sensors.AlarmSatus = false;
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
          if (historyLast.sensors.AlarmSatus) {
            // Thực hiện hành động cảnh báo ở đây
            // Ví dụ: Gửi email, thông báo, hoặc thực hiện các hành động khẩn cấp khác
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

  async startServer() {
    this.server.on('request', async (req, res) => {
      // Tạo một đối tượng URL từ URL yêu cầu
      this.logger.log(
        'Client connected: ' + req.rsinfo.address + ':' + req.rsinfo.port,
      );
      const requestUrl = new URL(req.url, `coap://${req.headers['Host']}`);
      this.logger.log(requestUrl.pathname);
      // Lấy các tham số truy vấn từ URL
      const queryParams = requestUrl.searchParams;
      // In ra các tham số truy vấn
      queryParams.forEach((value, key) => {
        this.logger.log(`Param: ${key}, Value: ${value}`);
      });
      let payload = '';
      req.on('data', (data) => {
        payload += data;
      });
      if (requestUrl.pathname === '/.well-known/core') {
        const resourceDescriptions =
          '</test>;ct=0,</device>;ct=0,</device?deviceId=23232>;ct=1,</alarm>;ct=0';

        // Send the resource descriptions in the response
        res.setOption('Content-Format', 'application/link-format');
        res.end(resourceDescriptions);
      } else if (requestUrl.pathname === '/alarm') {
        req.on('end', async () => {
          res.setOption('Content-Format', 'application/json');
          this.logger.log(payload);

          switch (req.method) {
            case 'POST':
              if (!isJSON(payload)) {
                this.logger.error('Dữ liệu không hợp lệ');
                res.end('Dữ liệu không hợp lệ');
                return;
              }
              const data: { deviceId: string } = JSON.parse(payload) as {
                deviceId: string;
              };
              const deviceGet = await this.devicesReposity.findOne({
                where: { deviceId: data.deviceId },
              });
              if (!deviceGet) {
                res.code = '4.04';
                res.end('deviceId không tồn tại');
                break;
              }
              res.code = '2.05';
              res.type = 'ACK';
              res.end(JSON.stringify({ AlarmReport: deviceGet.AlarmReport }));
              break;
          }
        });
      } else if (requestUrl.pathname === '/hello') {
        req.on('end', () => {
          this.logger.log(payload);
        });
      } else if (requestUrl.pathname === '/device') {
        req.on('end', async () => {
          res.setOption('Content-Format', 'application/json');
          const device: DevicesDto = {} as DevicesDto;
          const history: HistoryDto = {} as HistoryDto;
          this.logger.log(payload);
          switch (req.method) {
            case 'POST':
              if (!isJSON(payload)) {
                this.logger.error('Dữ liệu không hợp lệ');
                res.end('Dữ liệu không hợp lệ');
                return;
              }
              const data: DataCoapType = JSON.parse(payload) as DataCoapType;
              if (!isArray(data)) {
                break;
              }
              if (data?.length) {
                data?.forEach((obj) => {
                  switch (obj.testId) {
                    case 'MAIN_MCU_MODULE_SIGNAL':
                      device.deviceId = obj.details.deviceId;
                      break;
                    case 'SENSOR':
                      history.sensors = {
                        ...obj.details,
                      } as SensorsDto;
                      break;
                    case 'BATTERY_VOLTAGE':
                      history.battery = {
                        ...obj.details,
                      } as BatteryDto;
                      break;
                    case 'CELLULAR_SIM':
                      history.sim = { ...obj.details } as SimDto;
                      break;
                    case 'CELLULAR_SIGNAL':
                      history.signal = {
                        ...obj.details,
                      } as SignalDto;
                      break;
                  }
                });
              }

              const deviceFound = await this.devicesReposity
                .createQueryBuilder('devices')
                .leftJoinAndSelect('devices.history', 'history')
                .leftJoinAndSelect('devices.warningLogs', 'warningLogs')
                .leftJoinAndSelect('history.sensors', 'sensors')
                .leftJoinAndSelect('history.battery', 'battery')
                .leftJoinAndSelect('history.signal', 'signal')
                .leftJoinAndSelect('history.sim', 'sim')
                .leftJoinAndSelect('devices.customers', 'customers')
                .where('devices.deviceId = :deviceId', {
                  deviceId: device?.deviceId ?? '',
                })
                .getOne();
              if (!deviceFound) {
                // Device not found
                this.logger.log(`Device not found with id: ${device.deviceId}`);
                res.end(`Device not found with id: ${device.deviceId}`);
                break;
              }
              try {
                const sensorsHistory = await this.sensorsReposity.save({
                  ...history?.sensors,
                } as SensorsEntity);
                const batteryHistory = await this.batteryReposity.save({
                  ...history.battery,
                } as BatteryEntity);
                const simHistory = await this.simReposity.save({
                  ...history?.sim,
                } as SimEntity);

                const signalHistory = await this.signalReposity.save({
                  ...history?.signal,
                } as SignalEntity);
                const historyDevice = await this.historyRepository.save({
                  sensors: sensorsHistory,
                  battery: batteryHistory,
                  sim: simHistory,
                  signal: signalHistory,
                  logger: payload,
                } as HistoryEntity);
                deviceFound.history.push(historyDevice);
                if (history?.sensors?.AlarmSatus) {
                  const warningLogs = await this.warningLogsRepository.save({
                    message: `Cảnh báo cháy với thiết bị ${deviceFound.deviceName} có mã thiết bị ${deviceFound.deviceId}`,
                  } as WarningLogsEntity);
                  deviceFound.warningLogs.push(warningLogs);
                  await this.devicesReposity.save(deviceFound);
                  this.sendWarning(device.deviceId);
                } else {
                  await this.devicesReposity.save(deviceFound);
                }
                await this.chatGateWay.sendDeviceDataToRoom(
                  device.deviceId,
                  JSON.stringify({
                    type: 'device',
                    message: {
                      deviceId: device?.deviceId,
                      ...deviceFound?.history?.sort(
                        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                      )[0],
                    },
                  }),
                );
                await this.chatGateWay.sendLoggerDataToRoom(
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
                );
                res.code = '2.05';
                res.write('update thiet bi thanh cong');
                res.end('');
                break;
              } catch (error) {
                console.error(error);
                break;
              }

            case 'GET':
              const deviceId = queryParams.get('deviceId');
              if (deviceId === null) {
                res.code = '4.04';
                break;
              }
              const deviceGet = await this.devicesReposity.findOne({
                where: { deviceId },
              });
              if (!deviceGet) {
                res.code = '4.04';
                res.end('deviceId không tồn tại');
                break;
              }
              res.code = '2.05';
              res.write(JSON.stringify({ AlarmReport: deviceGet.AlarmReport }));
              res.end('');
              break;
            case 'PUT':
              res.end(`Update device thất bại: `);
              break;

            case 'DELETE':
              res.end(`Update device thất bại: `);
              break;
          }
        });
      } else {
        res.end('Không có path này');
      }
    });
    // this.server.
  }
  sendRequest() {
    // Tạo một đối tượng yêu cầu CoAP với các tùy chọn cần thiết
    this.server.listen(Number(process.env.COAP_PORT), () => {
      const req = request({
        method: 'GET', // Phương thức yêu cầu
        hostname: 'localhost', // Tên máy chủ đích
        pathname: '/hello', // Đường dẫn đích
        query: 'param1=value1&param2=value2',
        confirmable: true, // Yêu cầu xác nhận
        port: Number(process.env.COAP_PORT),
      });

      // Đăng ký các trình nghe sự kiện cho yêu cầu
      req.on('response', (res) => {
        // Xử lý phản hồi từ máy chủ đích
        let responsePayload = '';
        res.on('data', (data) => {
          responsePayload += data;
        });
        res.on('end', () => {
          this.logger.log('Status code:', res.code);
          this.logger.log('Response payload:', responsePayload);
        });
      });

      req.on('error', (err) => {
        // Xử lý lỗi nếu có
        console.error('Request error:', err.message);
      });

      req.end(
        `Kết nối Coap thành công với Port ${Number(process.env.COAP_PORT)}`,
      );
    });
  }
}
