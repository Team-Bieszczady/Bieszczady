import { IsIn } from 'class-validator';

export class UpdateAccountStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE'])
  accountStatus!: 'ACTIVE' | 'INACTIVE';
}
