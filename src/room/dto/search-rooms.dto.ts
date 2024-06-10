import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class SearchRoomsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @Type(() => String)
  readonly ownerId?: string;
  @IsOptional()
  @Type(() => String)
  readonly type?: 'message-suporter' | 'message-device';
  @IsOptional()
  @Type(() => String)
  readonly status?:
    | 'RESOLVED'
    | 'IN PROGRESS'
    | 'PENDING'
    | 'NEEDS CLARIFICATION';
}
