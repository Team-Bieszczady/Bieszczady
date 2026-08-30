import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;
}
