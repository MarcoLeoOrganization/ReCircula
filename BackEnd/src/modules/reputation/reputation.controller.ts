import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ReputationService } from './reputation.service';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { SolicitarVerificacionDto } from './dto/solicitar-verificacion.dto';
import { RolUsuario } from '../identity/entities/usuario.entity';

/** Configuración de multer para evidencias de verificación */
const verificacionStorage = diskStorage({
  destination: './uploads/verificacion',
  filename: (_req, file, cb) => {
    const unique = randomUUID();
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Reputation — RF-06')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly svc: ReputationService) {}

  // ── RF-06.1 — Calificaciones ────────────────────────────────────────────────

  @Post('calificaciones')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-06.1 — Calificar a la contraparte al completar un intercambio',
  })
  async calificar(
    @Body() dto: CrearCalificacionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.calificar(dto, user.id);
  }

  @Public()
  @Get('calificaciones/:usuarioId')
  @ApiOperation({
    summary: 'RF-06.1 — Obtener calificaciones recibidas por un usuario',
  })
  async getCalificaciones(@Param('usuarioId') usuarioId: string) {
    return this.svc.getCalificaciones(usuarioId);
  }

  // ── RF-06.3 — Perfil Reparador ──────────────────────────────────────────────

  @Public()
  @Get('reparadores/:id/perfil')
  @ApiOperation({
    summary: 'RF-06.3 — Perfil público de un reparador verificado',
    description:
      'Retorna puntuación acumulada, reparaciones documentadas, especialidades y últimas calificaciones.',
  })
  async getPerfilReparador(@Param('id') id: string) {
    return this.svc.getPerfilReparador(id);
  }

  // ── RF-06.2 — Solicitud de verificación ────────────────────────────────────

  @Post('verificacion/solicitar')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.USUARIO_GENERAL)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('evidencias', 10, { storage: verificacionStorage }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Descripción + hasta 10 imágenes de evidencia (campo "evidencias")',
    schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string' },
        evidencias: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'RF-06.2 — Solicitar verificación adjuntando evidencias fotográficas',
  })
  async solicitarVerificacion(
    @Body() dto: SolicitarVerificacionDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.solicitarVerificacion(dto, files ?? [], user.id);
  }

  @Get('verificacion/pendientes')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'RF-06.2 — Listar solicitudes de verificación pendientes (solo ADMIN)',
  })
  async getPendientes() {
    return this.svc.getSolicitudesPendientes();
  }

  @Patch('verificacion/:id/revisar')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'RF-06.2 — Aprobar o rechazar una solicitud de verificación (solo ADMIN)',
  })
  async revisarSolicitud(
    @Param('id') id: string,
    @Body() body: { decision: 'APROBADA' | 'RECHAZADA'; notasAdmin?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.revisarSolicitud(
      id,
      body.decision,
      body.notasAdmin,
      user.id,
    );
  }
}
