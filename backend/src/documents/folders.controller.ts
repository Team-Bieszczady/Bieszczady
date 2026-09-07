import { Body, Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { FoldersService } from "./folders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

  @Controller('/projects/:projectId/folders')
  export class FoldersController {
    constructor(private readonly foldersServie: FoldersService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getFolders(@Param('projectId', ParseUUIDPipe) projectId: string) {
      return await this.foldersServie.findAllForProject(projectId);
    }
  }