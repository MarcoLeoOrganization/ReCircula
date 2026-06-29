import { Calificacion } from '../entities/calificacion.entity';
import { SolicitudVerificacion } from '../entities/solicitud-verificacion.entity';
import { EstadoVerificacion } from '../../../common/types';

export interface PerfilReparadorResult {
  reparadorId: string;
  nombre: string;
  nombreTaller: string | null;
  especialidades: string[];
  puntuacion: number;
  reparacionesDocumentadas: number;
}

/** Puerto (interfaz abstracta) del repositorio de reputación */
export abstract class ReputationRepository {
  /** Calificaciones */
  abstract crearCalificacion(data: Partial<Calificacion>): Promise<Calificacion>;
  abstract findCalificacionByTxYCalificador(
    transaccionId: string,
    calificadorId: string,
  ): Promise<Calificacion | null>;
  abstract getCalificacionesDeUsuario(usuarioId: string): Promise<Calificacion[]>;

  /** Perfil reparador (vista DB) */
  abstract getPerfilReparador(reparadorId: string): Promise<PerfilReparadorResult | null>;

  /** Verificación */
  abstract crearSolicitudVerificacion(
    data: Partial<SolicitudVerificacion>,
  ): Promise<SolicitudVerificacion>;
  abstract getSolicitudesPendientes(): Promise<SolicitudVerificacion[]>;
  abstract findSolicitudById(id: string): Promise<SolicitudVerificacion | null>;
  abstract actualizarSolicitud(
    id: string,
    data: Partial<SolicitudVerificacion>,
  ): Promise<SolicitudVerificacion>;
}
