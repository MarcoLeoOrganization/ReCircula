import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { PublicationsService } from './publications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { FindAllOptions } from './repositories/publications.repository';
import { ModalidadIntercambio } from '../../common/types';

@ApiTags('Publications — RF-02')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly svc: PublicationsService) {}

  // ── RF-02.1 / RF-02.2 / RF-02.3  Crear publicación con imágenes y componentes ────
  @Post()
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('imagenes', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'RF-02.1 — Crear una nueva publicación de artículo',
    description:
      'Registra un artículo para intercambio. Permite subir hasta 10 imágenes (JPG, PNG, WebP) ' +
      'y desglosar componentes funcionales/dañados.',
  })
  async crear(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ) {
    // Si viene de un formulario multipart, los objetos anidados pueden venir como cadenas de texto JSON.
    // Los pre-procesamos aquí para que calcen con el DTO.
    try {
      if (typeof body.ubicacion === 'string') {
        body.ubicacion = JSON.parse(body.ubicacion);
      }
      if (typeof body.componentes === 'string') {
        body.componentes = JSON.parse(body.componentes);
      }
    } catch {
      throw new BadRequestException(
        'Formato de datos anidados inválido (deben ser JSON válidos)',
      );
    }

    // Convertimos de string a number para campos numéricos que vienen en multipart form-data
    if (body.precio !== undefined && body.precio !== '') {
      body.precio = Number(body.precio);
    }
    if (body.ubicacion) {
      if (body.ubicacion.latitud !== undefined)
        body.ubicacion.latitud = Number(body.ubicacion.latitud);
      if (body.ubicacion.longitud !== undefined)
        body.ubicacion.longitud = Number(body.ubicacion.longitud);
    }
    if (body.componentes && Array.isArray(body.componentes)) {
      body.componentes = body.componentes.map((c: any) => ({
        ...c,
        funcional: c.funcional === 'true' || c.funcional === true,
        precioPieza:
          c.precioPieza !== undefined && c.precioPieza !== ''
            ? Number(c.precioPieza)
            : undefined,
      }));
    }

    // El validator DTO actuará sobre el objeto pre-procesado
    const dto = body as CreatePublicationDto;
    return this.svc.crear(dto, user.id, files || []);
  }

  // ── RF-03.1 / RF-03.2  Buscar / Listar publicaciones (Público) ────────────────────
  @Public()
  @Get()
  @ApiOperation({
    summary: 'RF-03.1 — Listar publicaciones activas',
    description:
      'Retorna el catálogo. Si se pasan latitud, longitud y radioKm, filtra por proximidad geográfica.',
  })
  async buscar(
    @Query('latitud') latitud?: string,
    @Query('longitud') longitud?: string,
    @Query('radioKm') radioKm?: string,
    @Query('categoria') categoria?: string,
    @Query('modalidad') modalidad?: ModalidadIntercambio,
  ) {
    const filtros: FindAllOptions = {};
    if (latitud && longitud) {
      filtros.latitud = Number(latitud);
      filtros.longitud = Number(longitud);
      if (radioKm) filtros.radioKm = Number(radioKm);
    }
    if (categoria) filtros.categoria = categoria;
    if (modalidad) filtros.modalidad = modalidad;

    return this.svc.buscarTodas(filtros);
  }

  // ── RF-02.5  Ver detalle de una publicación (Público) ─────────────────────────────
  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'RF-02.5 — Detalle de una publicación con componentes y fotos',
  })
  async obtenerDetalle(@Param('id') id: string) {
    return this.svc.obtenerDetalle(id);
  }

  // ── RF-02.4  Editar publicación ───────────────────────────────────────────────────
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'RF-02.4 — Editar campos de la publicación (si no hay transacción activa)',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    try {
      if (typeof body.ubicacion === 'string') {
        body.ubicacion = JSON.parse(body.ubicacion);
      }
    } catch {
      throw new BadRequestException('Formato de ubicación inválido');
    }

    if (body.precio !== undefined && body.precio !== '') {
      body.precio = Number(body.precio);
    }
    if (body.ubicacion) {
      if (body.ubicacion.latitud !== undefined)
        body.ubicacion.latitud = Number(body.ubicacion.latitud);
      if (body.ubicacion.longitud !== undefined)
        body.ubicacion.longitud = Number(body.ubicacion.longitud);
    }

    const dto = body as UpdatePublicationDto;
    return this.svc.actualizar(id, dto, user.id);
  }

  // ── RF-02.4  Archivar publicación ──────────────────────────────────────────────────
  @Patch(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-02.4 — Archivar una publicación',
  })
  async archivar(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.archivar(id, user.id);
  }
}
