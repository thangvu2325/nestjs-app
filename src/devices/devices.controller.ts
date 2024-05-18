import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DevicesDto } from './dto/devices.dto';
import { DevicesService } from './devices.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { HistoryService } from './history.service';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicessService: DevicesService,
    private readonly historyService: HistoryService,
  ) {}
  @Get()
  getAllDevice(@Query('customer_id') customer_id: string): Promise<{
    devices: Array<DevicesDto>;
    devicesCount: number;
  }> {
    return this.devicessService.findAll({}, customer_id);
  }
  @Post('')
  createDevice(@Body() Dto: DevicesDto): Promise<{ result: string }> {
    return this.devicessService.saveDevice(Dto);
  }
  @Put(':deviceId/:roomId')
  updateDevice(
    @Param('deviceId') deviceId: string,
    @Param('roomId') roomId: string,
  ): Promise<{ result: string }> {
    return this.devicessService.updateDevice(roomId, deviceId);
  }
}
