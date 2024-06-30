import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetMessagesDto extends PaginationDto {
  @IsString()
  @ApiProperty()
  @Type(() => String)
  readonly roomId: string;
  @Expose()
  owner: string;
}
