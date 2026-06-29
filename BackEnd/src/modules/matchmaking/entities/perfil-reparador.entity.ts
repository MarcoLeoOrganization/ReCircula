import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, ValueTransformer,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';

export const pointTransformer: ValueTransformer = {
  from(value: any) {
    if (!value) return null;
    if (typeof value === 'object' && value.type === 'Point')
      return { latitud: value.coordinates[1], longitud: value.coordinates[0] };
    if (typeof value === 'string' && value.startsWith('POINT')) {
      const m = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (m) return { latitud: parseFloat(m[2]), longitud: parseFloat(m[1]) };
    }
    return value;
  },
  to(value: any) {
    if (!value) return null;
    if (typeof value === 'object' && value.latitud !== undefined)
      return { type: 'Point', coordinates: [value.longitud, value.latitud] };
    return value;
  },
};

@Entity('perfiles_reparador')
export class PerfilReparador {
  @PrimaryColumn({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'nombre_taller', type: 'varchar', length: 200, nullable: true })
  nombreTaller: string | null;

  @Column({ name: 'descripcion_taller', type: 'text', nullable: true })
  descripcionTaller: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  especialidades: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  puntuacion: number;

  @Column({ name: 'reparaciones_documentadas', type: 'int', default: 0 })
  reparacionesDocumentadas: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: pointTransformer,
  })
  ubicacion: { latitud: number; longitud: number } | null;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  @Column({ name: 'fecha_solicitud_verificacion', type: 'timestamptz', nullable: true })
  fechaSolicitudVerificacion: Date | null;

  @Column({ name: 'fecha_verificacion', type: 'timestamptz', nullable: true })
  fechaVerificacion: Date | null;

  @Column({ name: 'verificado_por', type: 'uuid', nullable: true })
  verificadoPor: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;
}