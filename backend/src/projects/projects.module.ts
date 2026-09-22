import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import {
  ProjectRecipientsController,
  ProjectStatusesController,
  ProjectTypesController,
} from './dictionaries.controller';
import { DictionariesService } from './dictionaries.service';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { RisksController } from './risks.controller';
import { RisksService } from './risks.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';

@Module({
  imports: [UsersModule],
  controllers: [
    ProjectsController,
    ProjectStatusesController,
    ProjectTypesController,
    ProjectRecipientsController,
    StagesController,
    ActivitiesController,
    GoalsController,
    RisksController,
    MembersController,
    TasksController,
    SubtasksController,
  ],
  providers: [
    PrismaService,
    ProjectsService,
    DictionariesService,
    StagesService,
    ActivitiesService,
    GoalsService,
    RisksService,
    MembersService,
    TasksService,
    SubtasksService,
    StageCompletionService,
    ProjectAccessService,
  ],
  exports: [ProjectAccessService]
})
export class ProjectsModule {}
