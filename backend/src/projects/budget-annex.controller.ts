import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DirectorGuard } from '../auth/guards/director.guard';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { BudgetAnnexService } from './budget-annex.service';
import {
  BudgetCommentDto,
  BudgetDescriptionDto,
  BudgetReasonDto,
} from './dto/budget.dto';

@ApiTags('budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('BUDGET')
@Controller()
export class BudgetAnnexController {
  constructor(private readonly annexes: BudgetAnnexService) {}

  @Post('projects/:projectId/budget/annexes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Open a new aneks',
    description:
      'Copies the plan of the current version, keeping category and position ids. Only one aneks can be open at a time.',
  })
  @ApiResponse({ status: 201, description: 'Aneks created as DRAFT' })
  @ApiResponse({ status: 409, description: 'An aneks is already open' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.annexes.create(projectId, actor);
  }

  @Post('budget-versions/:id/submit')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send a draft for approval' })
  @ApiResponse({ status: 204, description: 'Now PENDING' })
  @ApiResponse({ status: 409, description: 'Not a draft, or no changes' })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.submit(id, actor);
  }

  @Post('budget-versions/:id/withdraw')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Take a pending version back to draft' })
  @ApiResponse({ status: 204, description: 'Back to DRAFT' })
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.withdraw(id, actor);
  }

  @UseGuards(DirectorGuard)
  @Post('budget-versions/:id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Approve a version',
    description:
      'It becomes the current budget. Refused while a removed position still has spending.',
  })
  @ApiBody({ type: BudgetDescriptionDto })
  @ApiResponse({ status: 204, description: 'Approved and current' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'Wrong state, or no changes' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BudgetDescriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.approve(id, dto, actor);
  }

  @UseGuards(DirectorGuard)
  @Post('budget-versions/:id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject a pending version back to draft' })
  @ApiBody({ type: BudgetCommentDto })
  @ApiResponse({ status: 204, description: 'Back to DRAFT' })
  @ApiResponse({ status: 403, description: 'Director only' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BudgetCommentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.reject(id, dto, actor);
  }

  @UseGuards(DirectorGuard)
  @Post('budget-versions/:id/revert')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Undo the approval of the latest aneks',
    description: 'The previous approved version becomes current again.',
  })
  @ApiBody({ type: BudgetReasonDto })
  @ApiResponse({ status: 204, description: 'Back to DRAFT' })
  @ApiResponse({ status: 403, description: 'Director only' })
  async revert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BudgetReasonDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.revert(id, dto, actor);
  }

  @UseGuards(DirectorGuard)
  @Patch('budget-versions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Edit the description of an approved version' })
  @ApiBody({ type: BudgetDescriptionDto })
  @ApiResponse({ status: 204, description: 'Description saved' })
  @ApiResponse({ status: 403, description: 'Director only' })
  async editMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BudgetDescriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.editMetadata(id, dto, actor);
  }

  @Delete('budget-versions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Discard a draft' })
  @ApiResponse({ status: 204, description: 'Draft deleted' })
  @ApiResponse({ status: 409, description: 'Not a draft' })
  async discard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.annexes.discard(id, actor);
  }
}
