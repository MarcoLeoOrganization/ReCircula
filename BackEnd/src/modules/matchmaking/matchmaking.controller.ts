import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiOkResponse,
} from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import { BuscarPublicacionesDto } from './dto/buscar-publicaciones.dto';
import { MatchmakingReparadoresDto } from './dto/matchmaking-reparadores.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Matchmaking — RF-03')
@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly svc: MatchmakingService) {}

  // ── RF-03.1 + RF-03.2 ────────────────────────────────────────────────────
  @Public()
  @Get('publicaciones')
  @ApiOperation({
    summary: 'RF-03.1 / RF-03.2 — Publicaciones por proximidad y filtros',
    description:
      'Retorna publicaciones ordenadas por distancia al punto dado. ' +
      'Radio configurable de 5 a 50 km. ' +
      'Filtros opcionales: categoría y modalidad de intercambio.',
  })
  @ApiOkResponse({
    description: 'Lista ordenada por distancia ascendente.',
    schema: {
      example: {
        total: 2,
        radioKm: 10,
        resultados: [
          {
            id: 'uuid',
            titulo: 'iPhone 12 — pantalla rota',
            categoria: 'Smartphones y Tablets',
            modalidad: 'TRUEQUE',
            precio: null,
            distanciaKm: 1.43,
            publicadorNombre: 'Carlos López',
            latitud: 20.918,
            longitud: -101.348,
            imagenPrincipal: '/uploads/publications/abc.jpg',
          },
        ],
      },
    },
  })
  buscarPublicaciones(@Query() dto: BuscarPublicacionesDto) {
    return this.svc.buscarPublicaciones(dto);
  }

  // ── RF-03.3 ───────────────────────────────────────────────────────────────
  @Public()
  @Get('reparadores')
  @ApiOperation({
    summary: 'RF-03.3 — Reparadores Verificados cercanos para una categoría',
    description:
      'Conecta automáticamente un artículo "Para reparar" con Reparadores Verificados ' +
      'especializados en esa categoría dentro del radio configurado. ' +
      'Resultado ordenado por distancia y luego por puntuación.',
  })
  @ApiOkResponse({
    description: 'Reparadores ordenados por distancia y puntuación.',
    schema: {
      example: {
        total: 1,
        radioKm: 20,
        categoria: 'Smartphones y Tablets',
        resultados: [
          {
            reparadorId: 'uuid',
            nombre: 'Taller Móvil León',
            nombreTaller: 'TechFix León',
            especialidades: ['Smartphones y Tablets', 'Computadoras y Laptops'],
            puntuacion: 4.8,
            reparacionesDocumentadas: 37,
            distanciaKm: 3.21,
            latitud: 21.122,
            longitud: -101.678,
          },
        ],
      },
    },
  })
  buscarReparadores(@Query() dto: MatchmakingReparadoresDto) {
    return this.svc.buscarReparadores(dto);
  }
}
