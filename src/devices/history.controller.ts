import { Controller, Get, Param, Query } from '@nestjs/common';

import { HistoryService } from './history.service';
import { HistoryDto } from './dto/history.dto';
// import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}
  @Get()
  // @ApiTags('Admin')
  // @ApiOperation({ summary: 'Get admin section' })
  // @Get('admin')
  // @ApiBearerAuth('JWT-auth') // This is the one that needs to match the name in main.ts
  getAllDevice(
    @Query()
    query: {
      customer_id?: string;
      deviceId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    historyList: Array<HistoryDto>;
    historyCount: number;
  }> {
    return this.historyService.Get(query);
  }
  @Get('logger/:deviceId')
  getAllHistoryLoggerDevice(
    @Param('deviceId') deviceId: string,
    @Query('take') take: string,
    @Query('take') skip: string,
  ) {
    return this.historyService.GetHistoryLogger(deviceId, {
      take,
      skip,
    });
  }
  @Get('request')
  getAllRequest(
    @Query()
    query: {
      customer_id?: string;
      deviceId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.historyService.GetRequest(query);
  }
}
