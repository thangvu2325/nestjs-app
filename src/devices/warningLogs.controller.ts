import { Controller, Get, Param, Query } from '@nestjs/common';
import { WarningLogsService } from './warningLogs.service';
import { WarningLogsDto } from './dto/warningLogs.dto';

@Controller('warningLogs')
export class WarningLogsController {
  constructor(private readonly warningLogsService: WarningLogsService) {}
  @Get()
  getAllWarningLogs(
    @Param('deviceId') deviceId: string,
    @Query()
    query: {
      customer_id?: string;
      deviceId?: string;
    },
  ): Promise<{
    warningLogsList: Array<WarningLogsDto>;
    warningLogsCount: number;
  }> {
    return this.warningLogsService.Get(query.deviceId, query.customer_id);
  }
}
