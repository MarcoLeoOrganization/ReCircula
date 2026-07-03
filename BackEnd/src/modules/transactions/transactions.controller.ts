import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Transactions — RF-04')
@Controller('transactions')
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'RF-04.1 — Proponer un trato/intercambio sobre una publicación',
  })
  async proponer(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    // Si viene de un body raw, nos aseguramos que precio sea número
    if (dto.precioAcordado !== undefined && dto.precioAcordado !== null) {
      dto.precioAcordado = Number(dto.precioAcordado);
    }
    return this.svc.proponer(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary:
      'RF-04.1 — Listar todas las transacciones donde participa el usuario',
  })
  async listarTodas(@CurrentUser() user: { id: string }) {
    return this.svc.buscarTodasParaUsuario(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'RF-04.1 — Ver detalle de una transacción' })
  async verDetalle(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.buscarPorId(id, user.id);
  }

  @Patch(':id/accept')
  @ApiOperation({
    summary: 'RF-04.1 — Aceptar propuesta de intercambio (propietario)',
  })
  async aceptar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.aceptar(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'RF-04.3 — Cancelar trato en cualquier estado no completado',
  })
  async cancelar(
    @Param('id') id: string,
    @Body() body: { notas?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.cancelar(id, user.id, body.notas);
  }

  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'RF-04.2 — Confirmar recepción/entrega del artículo (doble firma)',
  })
  async confirmar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.confirmar(id, user.id);
  }
}
