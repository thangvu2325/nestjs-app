import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  readonly roomId: string;
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  readonly content: string;
  @Expose()
  readonly userId: string;
}
