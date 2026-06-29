import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';
import { EstadoVerificacion } from '../../../common/types';

/**
 * SolicitudVerificacion — RF-06.2
 * Un VENDEDOR_REPARADOR puede solicitar ser verificado adjuntando evidencias fotográficas.
 * Un ADMIN revisa y aprueba o rechaza la solicitud.
 */
@Entity('solicitudes_verificacion')
export class SolicitudVerificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reparador_id' })
  reparadorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'reparador_id' })
  reparador: Usuario;

  @Column({
    type: 'text',
    default: EstadoVerificacion.PENDIENTE,
  })
  estado: EstadoVerificacion;

  /** Array de URLs de evidencias fotográficas almacenado como JSONB */
  @Column({ type: 'jsonb', default: [] })
  evidencias: string[];

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'revisado_por_id', nullable: true })
  revisadoPorId: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'revisado_por_id' })
  revisadoPor: Usuario | null;

  @Column({ name: 'notas_admin', type: 'text', nullable: true })
  notasAdmin: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;
}
