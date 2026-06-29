import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../identity/entities/usuario.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('publication/:publicationId')
  async getHistory(@Param('publicationId') publicationId: string) {
    return this.historyService.getHistoryByPublicationId(publicationId);
  }

  @Post('publication/:publicationId/repair')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.VENDEDOR_REPARADOR)
  async addRepair(
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateEntryDto,
  ) {
    return this.historyService.addRepairEntry(publicationId, user.id, dto);
  }
}
