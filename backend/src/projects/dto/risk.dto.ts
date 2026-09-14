import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { RISK_LEVELS, type RiskLevel } from '../../common/enums/project.enums';
import { TrimmedString } from '../../common/decorators/trimmed-string.decorator';

export class CreateRiskDto {
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsIn(RISK_LEVELS)
  @IsOptional()
  probability?: RiskLevel;

  @IsIn(RISK_LEVELS)
  @IsOptional()
  impact?: RiskLevel;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  responsibleUserId?: string | null;
}

export class UpdateRiskDto {
  @ValidateIf((_, value) => value !== undefined)
  @TrimmedString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @IsIn(RISK_LEVELS)
  @IsOptional()
  probability?: RiskLevel;

  @IsIn(RISK_LEVELS)
  @IsOptional()
  impact?: RiskLevel;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  @IsOptional()
  responsibleUserId?: string | null;
}
