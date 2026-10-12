import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [UsersModule, ProjectsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
