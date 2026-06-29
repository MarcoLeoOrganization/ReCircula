import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MatchmakingRepository } from './repositories/matchmaking.repository';
import { BuscarPublicacionesDto } from './dto/buscar-publicaciones.dto';
import { MatchmakingReparadoresDto } from './dto/matchmaking-reparadores.dto';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(private readonly repo: MatchmakingRepository) {}

  // ── RF-03.1 + RF-03.2 ────────────────────────────────────────────────────
  // Publicaciones ordenadas por proximidad + filtros de categoría / modalidad
  // ─────────────────────────────────────────────────────────────────────────
  async buscarPublicaciones(dto: BuscarPublicacionesDto) {
    // Si no vienen coordenadas no podemos ordenar por proximidad
    if (dto.latitud === undefined || dto.longitud === undefined) {
      throw new BadRequestException(
        'Se requieren latitud y longitud para la búsqueda por proximidad',
      );
    }

    this.logger.log(
      `Búsqueda geoespacial — lat:${dto.latitud} lng:${dto.longitud} radio:${dto.radioKm}km ` +
      `categoria:${dto.categoria ?? 'todas'} modalidad:${dto.modalidad ?? 'todas'}`,
    );

    const resultados = await this.repo.buscarPublicaciones(dto);

    return {
      total:      resultados.length,
      radioKm:    dto.radioKm ?? 10,
      resultados,
    };
  }

  // ── RF-03.3 ───────────────────────────────────────────────────────────────
  // Artículo "Para reparar" → Reparadores Verificados especializados cercanos
  // ─────────────────────────────────────────────────────────────────────────
  async buscarReparadores(dto: MatchmakingReparadoresDto) {
    this.logger.log(
      `Matchmaking reparadores — lat:${dto.latitud} lng:${dto.longitud} ` +
      `categoria:${dto.categoria} radio:${dto.radioKm}km`,
    );

    const resultados = await this.repo.buscarReparadores(dto);

    return {
      total:     resultados.length,
      radioKm:   dto.radioKm ?? 20,
      categoria: dto.categoria,
      resultados,
    };
  }
}
