import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersDto } from './customers.dto';
import { UsersService } from 'src/users/users.service';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import { PublicGuard } from 'src/auth/guards/publicRole.guard';
import { TicketsService } from 'src/tickets/tickets.service';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly ticketsService: TicketsService,
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
  @UseGuards(PublicGuard)
  @Post('/device/share')
  createKeyAddDevice(@Body('deviceId') deviceId: string, @Request() req) {
    return this.customersService.createKeyAddDevice(req.user.userId, deviceId);
  }
  @Post('/device/:customer_id')
  addDevice(
    @Body() Dto: DevicesDto,
    @Param('customer_id') customer_id: string,
  ) {
    return this.customersService.addDevice(Dto, customer_id);
  }

  @Get('/device/:customer_id')
  getAllDevice(@Param('customer_id') customer_id: string) {
    return this.customersService.getAllDevice(customer_id);
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
    @Param('customer_id') customer_id: string,
    @Param('deviceId') deviceId: string,
    @Body() dto: DevicesDto,
  ) {
    return this.customersService.updateDevice(dto, customer_id, deviceId);
  }

  @UseGuards(PublicGuard)
  @Get('/ticket')
  getAllTicketsCustomer(
    @Query() query: { startDate: string; endDate: string; status: string },
    @Request() req,
  ) {
    console.log(req.user);
    return this.ticketsService.Get({
      ...query,
      userId: req.user.userId ?? undefined,
    });
  }

  //@UseGuards(JwtGuard)
  @Post('/device/:customer_id/:deviceId')
  toggleAlarmStatus(
    @Param('customer_id') customer_id: string,
    @Param('deviceId') deviceId: string,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.toggleAlarmStatus(deviceId, customer_id);
  }
}
