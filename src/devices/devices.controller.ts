import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevicesDto } from './dto/devices.dto';
import { DevicesService } from './devices.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

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
  @UseGuards(JwtGuard)
  @Get(':customer_id')
  getAllDeviceforUser(
    @Req() request,
    @Param() params: { customer_id: string },
  ): Promise<{
    devices: Array<DevicesDto>;
    devicesCount: number;
  }> {
    console.log(params.customer_id);
    // const user = request.user; // Accessing user information from request
    return this.devicessService.findAll({}, params.customer_id);
  }
  @Post('')
  createDevice(@Body() Dto: DevicesDto): Promise<{ result: string }> {
    return this.devicessService.saveDevice(Dto);
  }
}
