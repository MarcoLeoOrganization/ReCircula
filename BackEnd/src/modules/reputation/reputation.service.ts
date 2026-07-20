import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReputationRepository } from './repositories/reputation.repository';
import { TransactionsRepository } from '../transactions/repositories/transactions.repository';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { SolicitarVerificacionDto } from './dto/solicitar-verificacion.dto';
import { EstadoTransaccion, EstadoVerificacion } from '../../common/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as path from 'path';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { Usuario, RolUsuario } from '../identity/entities/usuario.entity';
import {
  ReputationRatingCreatedEvent,
  ReputationVerificationRequestedEvent,
  ReputationVerificationReviewedEvent,
} from '../../common/events';

@Injectable()
export class ReputationService {
  constructor(
    private readonly repo: ReputationRepository,
    private readonly txRepo: TransactionsRepository,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: SupabaseStorageService,
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

    const calificacion = await this.repo.crearCalificacion({
      transaccionId: dto.transaccionId,
      calificadorId,
      calificadoId,
      puntuacion: dto.puntuacion,
      comentario: dto.comentario ?? null,
    });

    const emitRatingEvent = async () => {
      try {
        const calificador = await this.usuariosRepo.findOne({
          where: { id: calificadorId },
        });
        this.eventEmitter.emit(
          'reputation.rating_created',
          new ReputationRatingCreatedEvent(
            calificadoId,
            calificador?.nombre ?? 'Un usuario',
            dto.puntuacion,
            dto.transaccionId,
          ),
        );
      } catch (err) {
        console.error('Error al emitir evento de calificación', err);
      }
    };
    void emitRatingEvent();

    return calificacion;
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
    const calificaciones =
      await this.repo.getCalificacionesDeUsuario(reparadorId);

    return { ...perfil, calificaciones };
  }

  // ── RF-06.2 — Solicitar verificación ───────────────────────────────────────

  async solicitarVerificacion(
    dto: SolicitarVerificacionDto,
    files: Express.Multer.File[],
    reparadorId: string,
  ) {
    // Solo USUARIO_GENERAL puede solicitar ser reparador
    const usuario = await this.usuariosRepo.findOne({
      where: { id: reparadorId },
    });
    if (!usuario || usuario.rol !== RolUsuario.USUARIO_GENERAL) {
      throw new ForbiddenException(
        'Solo los usuarios generales pueden solicitar verificación para ser reparadores',
      );
    }

    // Subir archivos a Supabase Storage y obtener URLs públicas
    const evidencias: string[] = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = crypto.randomUUID() + ext;
      const url = await this.storageService.uploadFile(
        'verificacion',
        filename,
        file.buffer,
        file.mimetype,
      );
      evidencias.push(url);
    }

    const solicitud = await this.repo.crearSolicitudVerificacion({
      reparadorId,
      estado: EstadoVerificacion.PENDIENTE,
      evidencias,
      descripcion: dto.descripcion ?? null,
      notasAdmin: null,
      revisadoPorId: null,
    });

    try {
      this.eventEmitter.emit(
        'reputation.verification_requested',
        new ReputationVerificationRequestedEvent(usuario.nombre, solicitud.id),
      );
    } catch (err) {
      console.error('Error al notificar solicitud de verificación', err);
    }

    return solicitud;
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

    try {
      this.eventEmitter.emit(
        'reputation.verification_reviewed',
        new ReputationVerificationReviewedEvent(
          actualizada.reparadorId,
          decision === 'APROBADA',
          notasAdmin,
          actualizada.id,
        ),
      );
    } catch (err) {
      console.error('Error al notificar resultado de verificación', err);
    }

    return actualizada;
  }
}
