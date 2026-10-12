import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import {
  PROJECT_ROLES,
  type ProjectRoleValue,
} from '../../common/enums/project.enums';
import {
  PROJECT_SCOPED_MODULES,
  type ProjectScopedModule,
} from '../../common/enums/module.enum';

export class AddMemberDto {
  @IsUUID()
  userId!: string;

  @IsIn(PROJECT_ROLES)
  projectRole!: ProjectRoleValue;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PROJECT_SCOPED_MODULES, { each: true })
  modules?: ProjectScopedModule[];
}

export class UpdateMemberRoleDto {
  @IsIn(PROJECT_ROLES)
  projectRole!: ProjectRoleValue;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PROJECT_SCOPED_MODULES, { each: true })
  modules?: ProjectScopedModule[];
}

export class UpdateMemberPartnerDto {
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  partnerId!: string | null;
}
