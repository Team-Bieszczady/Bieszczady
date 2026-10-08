import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';

@Module({
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  imports: [UsersModule],
})
export class ParticipantsModule {}
