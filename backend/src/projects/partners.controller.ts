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
import { DirectorGuard } from '../auth/guards/director.guard';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

@ApiTags('partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DirectorGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get()
  @ApiOperation({
    summary: 'List partner organisations',
    description: 'Ordered by name, each with the projects it is linked to.',
  })
  @ApiResponse({ status: 200, description: 'List of partners' })
  @ApiResponse({ status: 403, description: 'Director only' })
  async list() {
    return this.partners.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one partner' })
  @ApiResponse({ status: 200, description: 'Partner' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.partners.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a partner',
    description:
      'agreementValidUntil is cleared when agreement is "Brak umowy"; null means no expiry.',
  })
  @ApiBody({
    type: CreatePartnerDto,
    examples: {
      example: {
        summary: 'New partner',
        value: {
          name: 'Gmina Lutowiska',
          type: 'Samorząd',
          nip: '6881004521',
          city: 'Lutowiska',
          email: 'sekretariat@lutowiska.pl',
          contactName: 'Tomasz Hnat',
          contactEmail: 't.hnat@lutowiska.pl',
          contactPhone: '+48 13 461 00 01',
          agreement: 'Porozumienie',
          agreementValidUntil: null,
          status: 'ACTIVE',
          projectIds: [],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Partner created' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 409, description: 'A linked project does not exist' })
  async create(@Body() dto: CreatePartnerDto) {
    return this.partners.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit a partner',
    description:
      'Sending projectIds replaces the whole set of linked projects.',
  })
  @ApiBody({ type: UpdatePartnerDto })
  @ApiResponse({ status: 200, description: 'Partner updated' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 409, description: 'A linked project does not exist' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartnerDto,
  ) {
    return this.partners.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a partner' })
  @ApiResponse({ status: 204, description: 'Partner deleted (no content)' })
  @ApiResponse({ status: 403, description: 'Director only' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.partners.remove(id);
  }
}
