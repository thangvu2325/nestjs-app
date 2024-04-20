// coap.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createServer, request } from 'coap';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesService } from 'src/devices/devices.service';
import { BatteryDto } from 'src/devices/dto/battery.dto';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import { SensorsDto } from 'src/devices/dto/sensors.dto';
import { SignalDto } from 'src/devices/dto/signal.dto';
import { SimDto } from 'src/devices/dto/sim.dto';
import { BatteryEntity } from 'src/devices/entities/battery.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { NetworkEntity } from 'src/devices/entities/network.entity';
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
    @InjectRepository(NetworkEntity)
    private readonly networkReposity: Repository<NetworkEntity>,
    @InjectRepository(SignalEntity)
    private readonly signalReposity: Repository<SignalEntity>,
    @InjectRepository(BatteryEntity)
    private readonly batteryReposity: Repository<BatteryEntity>,
    @InjectRepository(SimEntity)
    private readonly simReposity: Repository<SimEntity>,
    private readonly devicesServices: DevicesService,
  ) {
    this.server = createServer();
  }
  // jsonData = [
  //   {
  //     testId: 'MAIN_MCU_BLE_SIGNAL',
  //     results: {
  //       result: 'TEST_SUCCESSFUL',
  //       details: {
  //         deviceId: 'device_qr86nv',
  //         rssi: -13,
  //       },
  //     },
  //   },
  //   {
  //     testId: 'MAIN_MCU_BLE_COMMUNICATION',
  //     results: {
  //       durationMs: 0,
  //       result: 'TEST_SUCCESSFUL',
  //       details: {},
  //     },
  //   },
  //   {
  //     testId: 'Sensor',
  //     results: {
  //       result: 'TEST_SUCCESSFUL',
  //       details: {
  //         smokeValue: 300,
  //       },
  //     },
  //   },
  //   {
  //     testId: 'BATTERY_VOLTAGE',
  //     results: {
  //       result: 'TEST_SUCCESSFUL',
  //       details: {
  //         source: 'adc',
  //         voltage: 4045,
  //       },
  //     },
  //   },
  //   {
  //     testId: 'CELLULAR_SIM',
  //     results: {
  //       result: 'TEST_SUCCESSFUL',
  //       details: {
  //         imsi: '232010883709979',
  //       },
  //     },
  //   },
  //   {
  //     testId: 'CELLULAR_SIGNAL',
  //     results: {
  //       result: 'TEST_SUCCESSFUL',
  //       details: {
  //         band: 'B3',
  //         deviceNetworkRssiDbm: -59,
  //         gsmStatus: 'No GSM network, requesting LTE report',
  //         networkReport: {
  //           absoluteRadioFrequencyChannel: '1700',
  //           areaTacChangeCount: '0',
  //           cellChangeCount: '0',
  //           cellId: '4294967295',
  //           connectionStatus: '2',
  //           extendedDiscontinuousReception: '0',
  //           ipAddress: '10.47.37.34',
  //           mcc: '452',
  //           mnc: '4',
  //           referenceSignalReceivedPower: '82',
  //           referenceSignalReceivedQuality: '30',
  //           requestedActiveTime: '0',
  //           requestedPeriodicTrackingAreaUpdate: '96',
  //           tac: '25178',
  //         },
  //       },
  //     },
  //   },
  // ];
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
          let device: DevicesDto;
          switch (req.method) {
            case 'POST':
              const data: DataCoapType = JSON.parse(payload);
              if (data?.length) {
                data?.forEach((obj) => {
                  switch (obj.testId) {
                    case 'MAIN_MCU_BLE_SIGNAL':
                      if (obj.results.result === 'TEST_SUCCESSFUL') {
                        device = { ...obj.results.details } as DevicesDto;
                      }
                      break;
                    case 'Sensor':
                      if (obj.results.result === 'TEST_SUCCESSFUL') {
                        device.sensors = {
                          ...obj.results.details,
                        } as SensorsDto;
                      }
                      break;
                    case 'BATTERY_VOLTAGE':
                      if (obj.results.result === 'TEST_SUCCESSFUL') {
                        device.battery = {
                          ...obj.results.details,
                        } as BatteryDto;
                      }
                      break;
                    case 'CELLULAR_SIM':
                      if (obj.results.result === 'TEST_SUCCESSFUL') {
                        device.sim = { ...obj.results.details } as SimDto;
                      }
                      break;
                    case 'CELLULAR_SIGNAL':
                      if (obj.results.result === 'TEST_SUCCESSFUL') {
                        device.signal = { ...obj.results.details } as SignalDto;
                      }
                      break;
                  }
                });
              }
              const deviceFound = await this.devicesReposity
                .createQueryBuilder('devices')
                .leftJoinAndSelect('devices.sensors', 'sensors')
                .leftJoinAndSelect('devices.battery', 'battery')
                .leftJoinAndSelect('devices.signal', 'signal')
                .leftJoinAndSelect('signal.networkReport', 'network')
                .leftJoinAndSelect('devices.sim', 'sim')
                .where('devices.deviceId = :deviceId', {
                  deviceId: device.deviceId,
                }) // Sửa đổi ở đây
                .getOne(); // Sử dụng getOne() thay vì then()
              if (!deviceFound) {
                // Device not found
                console.log('Device not found');
                break;
              }
              // Save changes to the database
              try {
                await this.devicesReposity.update(deviceFound.id, {
                  ...deviceFound,
                  deviceId: device.deviceId,
                  rssi: device.rssi,
                });
                await this.sensorsReposity.update(deviceFound.sensors.id, {
                  ...deviceFound.sensors,
                  ...device.sensors,
                });
                await this.batteryReposity.update(deviceFound.battery.id, {
                  ...deviceFound.battery,
                  ...device.battery,
                });

                await this.signalReposity.update(deviceFound.signal.id, {
                  ...deviceFound.signal,
                  band: device?.signal?.band ?? deviceFound.signal.band,
                  deviceNetworkRssiDbm:
                    device?.signal?.deviceNetworkRssiDbm ??
                    deviceFound.signal.deviceNetworkRssiDbm,
                  gsmStatus:
                    device?.signal?.gsmStatus ?? deviceFound.signal.gsmStatus,
                });
                await this.networkReposity.update(
                  deviceFound.signal.networkReport.id,
                  {
                    ...deviceFound.signal.networkReport,
                    ...device?.signal?.networkReport,
                  },
                );
                await this.simReposity.update(deviceFound.sim.id, device.sim);
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
    this.server.listen(() => {
      const req = request({
        method: 'POST', // Phương thức yêu cầu
        hostname: 'localhost', // Tên máy chủ đích
        pathname: '/test', // Đường dẫn đích
        query: 'param1=value1&param2=value2',
        confirmable: true, // Yêu cầu xác nhận
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
