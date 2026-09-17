import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateTaskDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: TaskStatus;

  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: TaskPriority;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
}

export class UpdateTaskDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @MaxLength(2000)
  description?: string;

  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: TaskPriority;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;

  @IsUUID()
  @IsOptional()
  activityId?: string;
}

export class UpdateTaskStatusDto {
  @IsIn(TASK_STATUSES)
  status!: TaskStatus;
}
