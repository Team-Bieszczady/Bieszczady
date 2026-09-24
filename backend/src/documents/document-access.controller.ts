import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { RequireModule } from "../auth/decorators/require-module.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleAccessGuard } from "../auth/guards/module-access.guard";
import { PasswordChangeGuard } from "../auth/guards/password-change.guard";
import { DocumentAccessService } from "./document-access.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { type AuthenticatedUser } from "../auth/types/auth.types";
import { GrantAccessDto } from "./dto/grant-access.dto";

@Controller('/projects/:projectId/document-access')
@UseGuards(JwtAuthGuard, PasswordChangeGuard, ModuleAccessGuard)
@RequireModule('DOCUMENTS')
export class DocumentAccessController {
  constructor(private readonly accessService: DocumentAccessService) {}

  @Get()
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('folderId') folderId: string | undefined,
    @Query('documentId') documentId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.accessService.listFor(user, projectId, {
      folderId,
      documentId,
    });
  }

  @Post()
  async grant(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GrantAccessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.accessService.grant(user, projectId, dto);
  }

  @Delete('/:accessId')
  @HttpCode(204)
  async revoke(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.accessService.revoke(user, projectId, accessId);
  }


}
