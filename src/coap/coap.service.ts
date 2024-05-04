// coap.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isArray, isJSON } from 'class-validator';
import { createServer, request } from 'coap';
import { ChatGateway } from 'src/chat/chat.gateway';
// import { ChatGateway } from 'src/chat/chat.gateway';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesService } from 'src/devices/devices.service';
import { BatteryDto } from 'src/devices/dto/battery.dto';
import { CoapClient } from 'node-coap-client';
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
import { CoapClientIpAddressEntity } from './coapClientIpAddress.entity';
@Injectable()
export class CoapService {
  private server: any;
  constructor(
    @InjectRepository(DevicesEntity)
    private readonly devicesReposity: Repository<DevicesEntity>,
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
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(CoapClientIpAddressEntity)
    private readonly coapClientIpAdressRepository: Repository<CoapClientIpAddressEntity>,
    private readonly devicesServices: DevicesService,
    private readonly chatGateWay: ChatGateway,
    private readonly logger: Logger,
  ) {
    this.coapClientIpAdressRepository.clear();
    this.server = createServer({
      clientIdentifier: () => {
        return 'abc';
      },
    });
  }

  async startServer() {
    this.server.close(async () => {
      await this.coapClientIpAdressRepository.clear();
    });
    this.server.on('request', async (req, res) => {
      // Tạo một đối tượng URL từ URL yêu cầu
      this.logger.log(
        'Client connected: ' + req.rsinfo.address + ':' + req.rsinfo.port,
      );
      const ipClient = 'coap://' + req.rsinfo.address + ':' + req.rsinfo.port;
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
          '</test>;ct=0,</device>;ct=0,</connection>;ct=0';

        // Send the resource descriptions in the response
        res.setOption('Content-Format', 'application/link-format');
        res.end(resourceDescriptions);
      } else if (requestUrl.pathname === '/connection') {
        req.on('end', async () => {
          if (!isJSON(payload)) {
            this.logger.warn('Dữ liệu không hợp lệ');
            res.end('Dữ liệu không hợp lệ');
            return;
          }
          this.logger.log(payload);
          const data: { deviceId: string } = JSON.parse(payload) as {
            deviceId: string;
          };
          const deviceFound = await this.devicesReposity.findOne({
            where: {
              deviceId: data.deviceId,
            },
          });
          if (!deviceFound) {
            this.logger.warn('Không tìm thấy thiết bị');
            res.end('Khong tim thay thiet bi');
          } else {
            const coapClientFound =
              await this.coapClientIpAdressRepository.findOne({
                where: {
                  ip: ipClient,
                },
              });
            if (!coapClientFound) {
              try {
                await this.coapClientIpAdressRepository.save({
                  ip: ipClient,
                } as CoapClientIpAddressEntity);
                res.end(`Kết nối thành công với thiết bị ${data.deviceId}`);
                this.logger.log(
                  `Kết nối thành công với thiết bị ${data.deviceId}`,
                );
              } catch (error) {
                res.end(`Kết nối thất bại với thiết bị ${data.deviceId}`);
                this.logger.error(
                  `Kết nối thất bại với thiết bị ${data.deviceId}`,
                );
              }
            } else {
              res.end(`Bạn đã kết nối rổi với thiết bị ${data.deviceId}`);
              this.logger.error(
                `Bạn đã kết nối rổi với thiết bị ${data.deviceId}`,
              );
            }
          }
        });
      } else if (requestUrl.pathname === '/hello') {
        req.on('end', () => {
          this.logger.log(payload);
        });
      } else if (requestUrl.pathname === '/device') {
        req.on('end', async () => {
          const device: DevicesDto = {} as DevicesDto;
          const history: HistoryDto = {} as HistoryDto;
          switch (req.method) {
            case 'POST':
              this.logger.log(payload);
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
                .where('devices.deviceId = :deviceId', {
                  deviceId: device?.deviceId ?? '',
                }) // Sửa đổi ở đây
                .getOne();
              if (!deviceFound) {
                // Device not found
                res.end(`Device not found with id: ${device.deviceId}`);
                this.logger.log(`Device not found with id: ${device.deviceId}`);
                break;
              }
              // // Save changes to the database
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
                } as HistoryEntity);
                deviceFound.history.push(historyDevice);
                await this.devicesReposity.save(deviceFound);
                this.chatGateWay.sendDeviceDataToClient(
                  device.deviceId,
                  JSON.stringify({
                    ...historyDevice,
                    deviceId: device.deviceId,
                    updatedAt: new Date(),
                  }),
                );
                res.end(`Update device  ${device.deviceId} thành công`);
                break;
              } catch (error) {
                console.error(error);
                res.end(`Update device thất bại: ${error.message}`);
                break;
              }

            case 'GET':
              res.end(`Update device thất bại: `);

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
        method: 'POST', // Phương thức yêu cầu
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
  async sendRequestToClient(deviceId: string, message: string) {
    const deviceCoapClient = await this.coapClientIpAdressRepository.findOne({
      where: {
        deviceId,
      },
    });
    if (!deviceCoapClient) {
    } else {
      await CoapClient.tryToConnect(deviceCoapClient.ip).then((result) => {
        if (result === true) {
          CoapClient.request(
            deviceCoapClient.ip,
            'post',
            Buffer.from(message),
            {
              keepAlive: false,
              confirmable: true,
              retransmit: true,
            },
          )
            .then((response) => {
              this.logger.log('Response:', response.payload.toString());
            })
            .catch((err) => {
              console.error('Error:', err);
            });
        } else {
          this.logger.warn('Thiết bị này hiện không kết nối');
        }
      });
    }
  }
}
