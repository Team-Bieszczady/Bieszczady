import { IsIn, IsUUID } from 'class-validator';
import {
  PROJECT_ROLES,
  type ProjectRoleValue,
} from '../../common/enums/project.enums';

export class AddMemberDto {
  @IsUUID()
  userId!: string;

  @IsIn(PROJECT_ROLES)
  projectRole!: ProjectRoleValue;
}

export class UpdateMemberRoleDto {
  @IsIn(PROJECT_ROLES)
  projectRole!: ProjectRoleValue;
}
