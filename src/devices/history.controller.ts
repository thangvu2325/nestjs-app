import { Controller, Get, Param, Query } from '@nestjs/common';

import { HistoryService } from './history.service';
import { HistoryDto } from './dto/history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}
  @Get()
  getAllDevice(
    @Param('deviceId') deviceId: string,
    @Query()
    query: {
      customer_id?: string;
      deviceId?: string;
    },
  ): Promise<{
    historyList: Array<HistoryDto>;
    historyCount: number;
  }> {
    return this.historyService.Get(query.deviceId, query.customer_id);
  }
}
