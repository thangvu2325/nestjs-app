import { Body, Controller, Get, Post } from '@nestjs/common';
import { DevicesDto } from './dto/devices.dto';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicessService: DevicesService) {}
  @Get()
  getAllDevice(): Promise<{
    devices: Array<DevicesDto>;
    devicesCount: number;
  }> {
    return this.devicessService.findAll({});
  }
  @Post('')
  createDevice(@Body() Dto: DevicesDto): Promise<{ result: string }> {
    return this.devicessService.saveDevice(Dto);
  }
}
