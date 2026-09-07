import { Body, Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { FoldersService } from "./folders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";
import { PasswordChangeGuard } from "../auth/guards/password-change.guard";

  @Controller('/projects/:projectId/folders')
  export class FoldersController {
    constructor(private readonly foldersServie: FoldersService) {}

    @UseGuards(JwtAuthGuard, PasswordChangeGuard)
    @Get()
    async getFolders(@Param('projectId', ParseUUIDPipe) projectId: string) {
      return await this.foldersServie.findAllForProject(projectId);
    }
  }