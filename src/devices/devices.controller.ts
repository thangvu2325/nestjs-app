import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { DevicesDto } from './dto/devices.dto';
import { DevicesService } from './devices.service';
import { HistoryService } from './history.service';
import { NodesDto } from './dto/nodes.dto';
import { NodeServices } from './nodes.service';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicessService: DevicesService,
    private readonly nodeService: NodeServices,
    private readonly historyService: HistoryService,
  ) {}

  @Get('/nodes')
  async getAllNodes(@Query('deviceId') deviceId?: string) {
    if (deviceId) {
      console.log(`Filtering nodes by deviceId: ${deviceId}`);
      return this.nodeService.getNodeinDevice(deviceId);
    }
    return this.devicessService.findAllNodes({});
  }
  @Post('/nodes')
  createNode(@Body() Dto: NodesDto) {
    return this.nodeService.createNode(Dto);
  }
  @Get()
  getAllDevice(
    @Query('customer_id') customer_id: string,
    @Query('deviceId') deviceId: string,
  ) {
    return this.devicessService.findAll({}, customer_id, deviceId);
  }
  @Get(':deviceId')
  getDeviceById(@Param('deviceId') deviceId: string) {
    return this.devicessService.GetDeviceById(deviceId);
  }
  @Post('')
  createDevice(@Body() Dto: DevicesDto) {
    return this.devicessService.saveDevice(Dto);
  }
  @Put(':deviceId/:roomId')
  updateDevice(
    @Param('deviceId') deviceId: string,
    @Param('roomId') roomId: string,
  ): Promise<{ result: string }> {
    return this.devicessService.updateDevice(roomId, deviceId);
  }
  @Get('/secret/updateHistoryRoom')
  updateHistoryRoom() {
    return this.devicessService.updateHistoryRoom();
  }
}
