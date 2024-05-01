// coap.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isArray, isJSON } from 'class-validator';
import { createServer, request } from 'coap';
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
    private readonly devicesServices: DevicesService,
    private readonly chatGateWay: ChatGateway,
  ) {
    this.server = createServer();
  }
  startServer() {
    this.server.on('request', async (req, res) => {
      // Tạo một đối tượng URL từ URL yêu cầu
      const requestUrl = new URL(req.url, `coap://${req.headers['Host']}`);

      // Lấy các tham số truy vấn từ URL
      const queryParams = requestUrl.searchParams;

      // In ra các tham số truy vấn
      queryParams.forEach((value, key) => {
        console.log(`Param: ${key}, Value: ${value}`);
      });
      let payload = '';
      req.on('data', (data) => {
        payload += data;
      });
      if (requestUrl.pathname === '/test') {
        console.log(JSON.stringify('Hello Coap'));
      } else {
        req.on('end', async () => {
          const device: DevicesDto = {} as DevicesDto;
          const history: HistoryDto = {} as HistoryDto;
          console.log(payload);
          if (!isJSON(payload)) {
            console.log('Dữ liệu không hợp lệ');
            return;
          }
          switch (req.method) {
            case 'POST':
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
                console.log('Device not found');
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
                break;
              } catch (error) {
                console.error(error);
                break;
              }

            case 'GET':
              break;

            case 'PUT':
              break;

            case 'DELETE':
              break;
          }

          res.end('Response from COAP server');
        });
      }
    });
  }
  sendRequest() {
    // Tạo một đối tượng yêu cầu CoAP với các tùy chọn cần thiết
    this.server.listen(Number(process.env.COAP_PORT), () => {
      const req = request({
        method: 'POST', // Phương thức yêu cầu
        hostname: 'localhost', // Tên máy chủ đích
        pathname: '/test', // Đường dẫn đích
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
          console.log('Status code:', res.code);
          console.log('Response payload:', responsePayload);
        });
      });

      req.on('error', (err) => {
        // Xử lý lỗi nếu có
        console.error('Request error:', err.message);
      });

      // Gửi yêu cầu với payload là 'Hello from CoAP client'
      req.end('Kết nối coap');
    });
  }
}
