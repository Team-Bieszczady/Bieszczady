import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { BudgetService } from './budget.service';
import { BudgetActualsService } from './budget-actuals.service';
import {
  CreateBudgetCategoryDto,
  CreateBudgetColumnDto,
  CreateBudgetInvoiceDto,
  CreateBudgetPositionDto,
  GrantBudgetAccessDto,
  MoveBudgetActualsDto,
  RenameBudgetColumnDto,
  UpdateBudgetActualDto,
  UpdateBudgetCategoryDto,
  UpdateBudgetCategorySettingsDto,
  UpdateBudgetCellDto,
  UpdateBudgetInvoiceStatusDto,
  UpdateBudgetPositionDto,
} from './dto/budget.dto';

@ApiTags('budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('BUDGET')
@Controller()
export class BudgetController {
  constructor(
    private readonly budget: BudgetService,
    private readonly actuals: BudgetActualsService,
  ) {}

  @Get('projects/:projectId/budget')
  @ApiOperation({
    summary: 'Read the whole budget of a project',
    description:
      'Versions with their plan, actuals keyed by position, column list, category settings, history, the caller permissions and the partners to pick from. The first read creates "Wersja podstawowa" and the default columns. Category and position ids are stable across versions. A partner user sees only the categories shared with their organisation.',
  })
  @ApiResponse({ status: 200, description: 'Budget store' })
  @ApiResponse({
    status: 404,
    description: 'Project not found or not a member',
  })
  async get(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.budget.getStore(projectId, viewer);
  }

  @Get('projects/:projectId/budget/partners')
  @ApiOperation({
    summary: 'Partners the budget can assign categories to',
    description:
      'Active partners linked to the project, plus any partner a category already uses.',
  })
  @ApiResponse({ status: 200, description: 'List of { id, name, status }' })
  async partners(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.budget.listPartners(projectId, viewer);
  }

  @Post('budget-versions/:versionId/categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a category to a draft or pending version' })
  @ApiBody({ type: CreateBudgetCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 403, description: 'No budget edit rights' })
  @ApiResponse({
    status: 409,
    description: 'Version approved, or partner not usable',
  })
  async createCategory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: CreateBudgetCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.createCategory(versionId, dto, actor);
  }

  @Patch('budget-versions/:versionId/categories/:key')
  @ApiOperation({ summary: 'Rename a category or change its partner' })
  @ApiBody({ type: UpdateBudgetCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('key', ParseUUIDPipe) key: string,
    @Body() dto: UpdateBudgetCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.updateCategory(versionId, key, dto, actor);
  }

  @Delete('budget-versions/:versionId/categories/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category and its positions' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  async deleteCategory(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('key', ParseUUIDPipe) key: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.budget.deleteCategory(versionId, key, actor);
  }

  @Post('budget-versions/:versionId/categories/:key/positions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a position to a category',
    description: 'Starts as "Nowa pozycja" with zero amounts.',
  })
  @ApiBody({ type: CreateBudgetPositionDto })
  @ApiResponse({ status: 201, description: 'Position created' })
  async createPosition(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('key', ParseUUIDPipe) key: string,
    @Body() dto: CreateBudgetPositionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.createPosition(versionId, key, dto, actor);
  }

  @Patch('budget-versions/:versionId/positions/:key')
  @ApiOperation({
    summary: 'Rename a position or change its plan amounts',
    description: 'Amounts are decimal strings, e.g. "1500.50".',
  })
  @ApiBody({ type: UpdateBudgetPositionDto })
  @ApiResponse({ status: 200, description: 'Position updated' })
  async updatePosition(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('key', ParseUUIDPipe) key: string,
    @Body() dto: UpdateBudgetPositionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.updatePosition(versionId, key, dto, actor);
  }

  @Delete('budget-versions/:versionId/positions/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a position from a version' })
  @ApiResponse({ status: 204, description: 'Position deleted' })
  async deletePosition(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('key', ParseUUIDPipe) key: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.budget.deletePosition(versionId, key, actor);
  }

  @Post('projects/:projectId/budget/columns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a custom column' })
  @ApiBody({ type: CreateBudgetColumnDto })
  @ApiResponse({ status: 201, description: 'Column created' })
  async createColumn(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBudgetColumnDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.createColumn(projectId, dto, actor);
  }

  @Patch('projects/:projectId/budget/columns/:key')
  @ApiOperation({ summary: 'Rename a custom column' })
  @ApiBody({ type: RenameBudgetColumnDto })
  @ApiResponse({ status: 200, description: 'Column renamed' })
  @ApiResponse({ status: 409, description: 'Column is locked' })
  async renameColumn(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('key') key: string,
    @Body() dto: RenameBudgetColumnDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.renameColumn(projectId, key, dto, actor);
  }

  @Delete('projects/:projectId/budget/columns/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom column and its values' })
  @ApiResponse({ status: 204, description: 'Column deleted' })
  @ApiResponse({ status: 409, description: 'Column is locked' })
  async deleteColumn(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('key') key: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.budget.deleteColumn(projectId, key, actor);
  }

  @Patch('projects/:projectId/budget/category-settings/:categoryKey')
  @ApiOperation({
    summary: 'Change partner flags or the document of a category',
    description: 'Settings are shared by every version of the category.',
  })
  @ApiBody({ type: UpdateBudgetCategorySettingsDto })
  @ApiResponse({ status: 200, description: 'Settings saved' })
  async updateCategorySettings(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('categoryKey', ParseUUIDPipe) categoryKey: string,
    @Body() dto: UpdateBudgetCategorySettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.updateCategorySettings(
      projectId,
      categoryKey,
      dto,
      actor,
    );
  }

  @Patch('projects/:projectId/budget/actuals/:positionKey/values/:columnKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Set one cell of a position',
    description:
      'An empty value clears the cell. "incurred" can be typed only in summary mode.',
  })
  @ApiBody({ type: UpdateBudgetCellDto })
  @ApiResponse({ status: 204, description: 'Cell saved' })
  async updateCell(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('positionKey', ParseUUIDPipe) positionKey: string,
    @Param('columnKey') columnKey: string,
    @Body() dto: UpdateBudgetCellDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.updateCell(
      projectId,
      positionKey,
      columnKey,
      dto,
      actor,
    );
  }

  @Patch('projects/:projectId/budget/actuals/:positionKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set the status or document of a position' })
  @ApiBody({ type: UpdateBudgetActualDto })
  @ApiResponse({ status: 204, description: 'Saved' })
  async updateActual(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('positionKey', ParseUUIDPipe) positionKey: string,
    @Body() dto: UpdateBudgetActualDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.updateActual(projectId, positionKey, dto, actor);
  }

  @Post('projects/:projectId/budget/actuals/move')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Move invoices and incurred amount to another position',
  })
  @ApiBody({ type: MoveBudgetActualsDto })
  @ApiResponse({ status: 204, description: 'Moved' })
  async move(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: MoveBudgetActualsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.move(projectId, dto, actor);
  }

  @Post('projects/:projectId/budget/actuals/:positionKey/invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an invoice to a position',
    description:
      'Status starts as TO_BE_PAID and the amount is added to "incurred".',
  })
  @ApiBody({ type: CreateBudgetInvoiceDto })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async addInvoice(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('positionKey', ParseUUIDPipe) positionKey: string,
    @Body() dto: CreateBudgetInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.actuals.addInvoice(projectId, positionKey, dto, actor);
  }

  @Post('projects/:projectId/budget/actuals/:positionKey/recalculate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set "incurred" to the sum of the invoices' })
  @ApiResponse({ status: 204, description: 'Recalculated' })
  async recalculate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('positionKey', ParseUUIDPipe) positionKey: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.recalculate(projectId, positionKey, actor);
  }

  @Patch('budget-invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark an invoice as paid or to be paid' })
  @ApiBody({ type: UpdateBudgetInvoiceStatusDto })
  @ApiResponse({ status: 204, description: 'Status changed' })
  @ApiResponse({ status: 403, description: 'Director or coordinator only' })
  async setInvoiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetInvoiceStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.setInvoiceStatus(id, dto, actor);
  }

  @Delete('budget-invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an invoice',
    description: 'Its amount is subtracted from "incurred".',
  })
  @ApiResponse({ status: 204, description: 'Invoice deleted' })
  async deleteInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.actuals.deleteInvoice(id, actor);
  }

  @Get('projects/:projectId/budget/access')
  @ApiOperation({ summary: 'People granted budget edit rights' })
  @ApiResponse({ status: 200, description: 'List of grants' })
  async listAccess(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.budget.listAccess(projectId, viewer);
  }

  @Post('projects/:projectId/budget/access')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grant budget edit rights to a project member',
    description: 'Director or the project coordinator.',
  })
  @ApiBody({ type: GrantBudgetAccessDto })
  @ApiResponse({ status: 201, description: 'Access granted' })
  @ApiResponse({ status: 409, description: 'Not a member, or already granted' })
  async grantAccess(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: GrantBudgetAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.budget.grantAccess(projectId, dto, actor);
  }

  @Delete('budget-access/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke budget edit rights' })
  @ApiResponse({ status: 204, description: 'Access revoked' })
  async revokeAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.budget.revokeAccess(id, actor);
  }
}
