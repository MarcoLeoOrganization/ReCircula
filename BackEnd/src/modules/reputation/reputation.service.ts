import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ReputationRepository } from './repositories/reputation.repository';
import { TransactionsRepository } from '../transactions/repositories/transactions.repository';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { SolicitarVerificacionDto } from './dto/solicitar-verificacion.dto';
import { EstadoTransaccion, EstadoVerificacion, RolUsuario } from '../../common/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../identity/entities/usuario.entity';
import { SolicitudVerificacion } from './entities/solicitud-verificacion.entity';

@Injectable()
export class ReputationService {
  constructor(
    private readonly repo: ReputationRepository,
    private readonly txRepo: TransactionsRepository,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  // ── RF-06.1 — Calificar contraparte ────────────────────────────────────────

  async calificar(dto: CrearCalificacionDto, calificadorId: string) {
    // 1. Verificar que la transacción exista
    const tx = await this.txRepo.findById(dto.transaccionId);
    if (!tx) {
      throw new NotFoundException('La transacción especificada no existe');
    }

    // 2. Verificar que esté completada
    if (tx.estado !== EstadoTransaccion.COMPLETADA) {
      throw new BadRequestException(
        'Solo se puede calificar una transacción completada',
      );
    }

    // 3. Verificar que el calificador participó en ella
    if (tx.iniciadorId !== calificadorId && tx.receptorId !== calificadorId) {
      throw new ForbiddenException(
        'Solo los participantes del intercambio pueden calificar',
      );
    }

    // 4. Verificar que no haya calificado ya esta transacción
    const yaCalificó = await this.repo.findCalificacionByTxYCalificador(
      dto.transaccionId,
      calificadorId,
    );
    if (yaCalificó) {
      throw new ConflictException('Ya calificaste esta transacción');
    }

    // 5. Determinar quién es la contraparte
    const calificadoId =
      tx.iniciadorId === calificadorId ? tx.receptorId : tx.iniciadorId;

    return this.repo.crearCalificacion({
      transaccionId: dto.transaccionId,
      calificadorId,
      calificadoId,
      puntuacion: dto.puntuacion,
      comentario: dto.comentario ?? null,
    });
  }

  // ── Listar calificaciones recibidas por un usuario ─────────────────────────

  async getCalificaciones(usuarioId: string) {
    return this.repo.getCalificacionesDeUsuario(usuarioId);
  }

  // ── RF-06.3 — Perfil público de reparador ──────────────────────────────────

  async getPerfilReparador(reparadorId: string) {
    const perfil = await this.repo.getPerfilReparador(reparadorId);
    if (!perfil) {
      throw new NotFoundException('Perfil de reparador no encontrado');
    }

    // Calificaciones recientes para mostrar en el perfil
    const calificaciones = await this.repo.getCalificacionesDeUsuario(reparadorId);

    return { ...perfil, calificaciones };
  }

  // ── RF-06.2 — Solicitar verificación ───────────────────────────────────────

  async solicitarVerificacion(
    dto: SolicitarVerificacionDto,
    files: Express.Multer.File[],
    reparadorId: string,
  ) {
    // Solo REPARADOR_VERIFICADO puede solicitar
    const usuario = await this.usuariosRepo.findOne({ where: { id: reparadorId } });
    if (!usuario || usuario.rol !== RolUsuario.REPARADOR_VERIFICADO) {
      throw new ForbiddenException(
        'Solo los reparadores verificados pueden solicitar verificación',
      );
    }

    // Mapear archivos a URLs relativas (multer ya los guardó en /uploads/verificacion/)
    const evidencias = files.map((f) => `/uploads/verificacion/${f.filename}`);

    return this.repo.crearSolicitudVerificacion({
      reparadorId,
      estado: EstadoVerificacion.PENDIENTE,
      evidencias,
      descripcion: dto.descripcion ?? null,
      notasAdmin: null,
      revisadoPorId: null,
    });
  }

  // ── RF-06.2 — Listar solicitudes pendientes (ADMIN) ────────────────────────

  async getSolicitudesPendientes() {
    return this.repo.getSolicitudesPendientes();
  }

  // ── RF-06.2 — Revisar solicitud (ADMIN) ────────────────────────────────────

  async revisarSolicitud(
    id: string,
    decision: 'APROBADA' | 'RECHAZADA',
    notasAdmin: string | undefined,
    adminId: string,
  ) {
    const solicitud = await this.repo.findSolicitudById(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud de verificación no encontrada');
    }

    if (solicitud.estado !== EstadoVerificacion.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    const actualizada = await this.repo.actualizarSolicitud(id, {
      estado: decision as EstadoVerificacion,
      revisadoPorId: adminId,
      notasAdmin: notasAdmin ?? null,
    });

    // Si se aprueba, no cambiamos el rol automáticamente en esta versión.
    // El ADMIN lo hará manualmente o en un sprint posterior.

    return actualizada;
  }
}
