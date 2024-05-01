import { Controller, Get, Param } from '@nestjs/common';

import { HistoryService } from './history.service';
import { HistoryDto } from './dto/history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}
  @Get(':deviceId')
  getAllDevice(@Param('deviceId') deviceId: string): Promise<{
    historyList: Array<HistoryDto>;
    historyCount: number;
  }> {
    return this.historyService.findOneByDeviceId({}, deviceId);
  }
}
