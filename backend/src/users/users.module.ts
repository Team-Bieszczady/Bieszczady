import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [UserController],
  providers: [UsersService, PrismaService, AuditLogService],
  exports: [UsersService],
})
export class UsersModule {}
