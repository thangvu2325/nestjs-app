import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersDto } from './customers.dto';
import { UsersService } from 'src/users/users.service';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}
  @Get()
  getAllCustomer(): Promise<{
    customers: Array<CustomersDto>;
    customersCount: number;
  }> {
    return this.customersService.findAll({});
  }
  @Post(':userId')
  createCustomer(
    @Param('userId') userId: string,
    @Body() Dto: CustomersDto,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.saveCustomer(userId, Dto);
  }
  @Post('/device/:customer_id')
  addDevice(
    @Body() Dto: DevicesDto,
    @Param('customer_id') customer_id: string,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.addDevice(Dto, customer_id);
  }
  @Delete('/device/:customer_id/:deviceId')
  delelteDevice(
    @Param('customer_id') customer_id: string,
    @Param('deviceId') deviceId: string,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.deleteDevice(deviceId, customer_id);
  }
  // @UseGuards(JwtGuard)
  @Put('/device/:customer_id/:deviceId')
  updateDevice(
    @Param() params: { customer_id: string; deviceId: string },
    @Body() dto: DevicesDto,
  ): Promise<{ result: string }> {
    return this.customersService.updateDevice(
      dto,
      params.customer_id,
      params.deviceId,
    );
  }
  @UseGuards(JwtGuard)
  @Post('/device/:customer_id/:deviceId')
  toggleAlarmStatus(
    @Param('customer_id') customer_id: string,
    @Param('deviceId') deviceId: string,
    @Request() req,
  ): Promise<{
    result: string;
  }> {
    console.log(req.user);
    return this.customersService.toggleAlarmStatus(deviceId, customer_id);
  }
}
