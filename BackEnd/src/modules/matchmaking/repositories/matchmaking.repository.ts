import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BuscarPublicacionesDto } from '../dto/buscar-publicaciones.dto';
import { MatchmakingReparadoresDto } from '../dto/matchmaking-reparadores.dto';

export interface ResultadoPublicacion {
  id: string;
  titulo: string;
  categoria: string;
  modalidad: string;
  precio: number | null;
  distanciaKm: number;
  publicadorNombre: string;
  latitud: number;
  longitud: number;
  imagenPrincipal: string | null;
}

export interface ResultadoReparador {
  reparadorId: string;
  nombre: string;
  nombreTaller: string | null;
  especialidades: string[];
  puntuacion: number;
  reparacionesDocumentadas: number;
  distanciaKm: number;
  latitud: number;
  longitud: number;
}

@Injectable()
export class MatchmakingRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * RF-03.1 — Publicaciones ordenadas por proximidad geográfica.
   * RF-03.2 — Filtros por categoría, estado de componente y modalidad.
   * Llama a fn_buscar_publicaciones() definida en el schema PostgreSQL.
   */
  async buscarPublicaciones(dto: BuscarPublicacionesDto): Promise<ResultadoPublicacion[]> {
    const raw: any[] = await this.dataSource.query(
      `SELECT * FROM fn_buscar_publicaciones($1, $2, $3, $4, $5::modalidad_intercambio)`,
      [
        dto.latitud,
        dto.longitud,
        dto.radioKm ?? 10,
        dto.categoria   ?? null,
        dto.modalidad   ?? null,
      ],
    );

    return raw.map((r) => ({
      id:                    r.id,
      titulo:                r.titulo,
      categoria:             r.categoria,
      modalidad:             r.modalidad,
      precio:                r.precio !== null ? parseFloat(r.precio) : null,
      distanciaKm:           parseFloat(r.distancia_km),
      publicadorNombre:      r.publicador_nombre,
      latitud:               parseFloat(r.latitud),
      longitud:              parseFloat(r.longitud),
      imagenPrincipal:       r.imagen_principal ?? null,
    }));
  }

  /**
   * RF-03.3 — Conectar artículo "Para reparar" con Reparadores Verificados
   * especializados en esa categoría dentro del radio configurado.
   * Llama a fn_matchmaking_reparadores() definida en el schema PostgreSQL.
   */
  async buscarReparadores(dto: MatchmakingReparadoresDto): Promise<ResultadoReparador[]> {
    const raw: any[] = await this.dataSource.query(
      `SELECT * FROM fn_matchmaking_reparadores($1, $2, $3, $4)`,
      [
        dto.latitud,
        dto.longitud,
        dto.categoria,
        dto.radioKm ?? 20,
      ],
    );

    return raw.map((r) => ({
      reparadorId:              r.reparador_id,
      nombre:                   r.nombre,
      nombreTaller:             r.nombre_taller ?? null,
      especialidades:           r.especialidades ?? [],
      puntuacion:               parseFloat(r.puntuacion),
      reparacionesDocumentadas: parseInt(r.reparaciones_documentadas, 10),
      distanciaKm:              parseFloat(r.distancia_km),
      latitud:                  parseFloat(r.latitud),
      longitud:                 parseFloat(r.longitud),
    }));
  }
}
