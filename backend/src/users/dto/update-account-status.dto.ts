import { IsIn } from 'class-validator';
import type { AccountStatus } from '../../auth/types/auth.types';

export class UpdateAccountStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE'])
  accountStatus!: AccountStatus;
}
