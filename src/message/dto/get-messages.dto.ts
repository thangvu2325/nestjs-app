import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetMessagesDto {
  @IsInt()
  @Type(() => String)
  readonly roomId: string;
}
