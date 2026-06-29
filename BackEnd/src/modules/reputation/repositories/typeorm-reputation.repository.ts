import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReputationRepository, PerfilReparadorResult } from './reputation.repository';
import { Calificacion } from '../entities/calificacion.entity';
import { SolicitudVerificacion } from '../entities/solicitud-verificacion.entity';

@Injectable()
export class TypeOrmReputationRepository extends ReputationRepository {
  constructor(
    @InjectRepository(Calificacion)
    private readonly calRepo: Repository<Calificacion>,
    @InjectRepository(SolicitudVerificacion)
    private readonly solRepo: Repository<SolicitudVerificacion>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  // ── Calificaciones ──────────────────────────────────────────────────────────

  async crearCalificacion(data: Partial<Calificacion>): Promise<Calificacion> {
    const cal = this.calRepo.create(data);
    return this.calRepo.save(cal);
  }

  async findCalificacionByTxYCalificador(
    transaccionId: string,
    calificadorId: string,
  ): Promise<Calificacion | null> {
    return this.calRepo.findOne({ where: { transaccionId, calificadorId } });
  }

  async getCalificacionesDeUsuario(usuarioId: string): Promise<Calificacion[]> {
    return this.calRepo.find({
      where: { calificadoId: usuarioId },
      relations: { calificador: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  // ── Perfil reparador (consulta a vista v_perfil_reparadores) ───────────────

  async getPerfilReparador(reparadorId: string): Promise<PerfilReparadorResult | null> {
    const rows = await this.dataSource.query<PerfilReparadorResult[]>(
      `SELECT
         id                    AS "reparadorId",
         nombre,
         nombre_taller         AS "nombreTaller",
         especialidades,
         puntuacion,
         reparaciones_documentadas AS "reparacionesDocumentadas"
       FROM v_perfil_reparadores
       WHERE id = $1`,
      [reparadorId],
    );
    return rows[0] ?? null;
  }

  // ── Solicitudes de verificación ────────────────────────────────────────────

  async crearSolicitudVerificacion(
    data: Partial<SolicitudVerificacion>,
  ): Promise<SolicitudVerificacion> {
    const sol = this.solRepo.create(data);
    return this.solRepo.save(sol);
  }

  async getSolicitudesPendientes(): Promise<SolicitudVerificacion[]> {
    return this.solRepo.find({
      where: { estado: 'PENDIENTE' as any },
      relations: { reparador: true },
      order: { fechaCreacion: 'ASC' },
    });
  }

  async findSolicitudById(id: string): Promise<SolicitudVerificacion | null> {
    return this.solRepo.findOne({ where: { id }, relations: { reparador: true, revisadoPor: true } });
  }

  async actualizarSolicitud(
    id: string,
    data: Partial<SolicitudVerificacion>,
  ): Promise<SolicitudVerificacion> {
    await this.solRepo.update(id, data);
    return this.solRepo.findOneOrFail({ where: { id } });
  }
}
