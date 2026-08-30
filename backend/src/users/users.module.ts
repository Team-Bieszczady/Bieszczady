import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { ModuleAccessService } from './module-access.service';

@Module({
  controllers: [UserController],
  providers: [
    UsersService,
    PrismaService,
    AuditLogService,
    ModuleAccessService,
  ],
  exports: [UsersService, ModuleAccessService],
})
export class UsersModule {}
