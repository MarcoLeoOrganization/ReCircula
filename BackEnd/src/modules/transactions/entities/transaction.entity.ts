import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';
import { Publication } from '../../publications/entities/publication.entity';
import { Calificacion } from '../../reputation/entities/calificacion.entity';
import { EstadoTransaccion, ModalidadIntercambio } from '../../../common/types';

@Entity('transacciones')
export class Transaction {
  @OneToMany(() => Calificacion, (c) => c.transaccion)
  calificaciones: Calificacion[];
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'publicacion_id' })
  publicacionId: string;

  @ManyToOne(() => Publication)
  @JoinColumn({ name: 'publicacion_id' })
  publicacion: Publication;

  @Column({ name: 'iniciador_id' })
  iniciadorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'iniciador_id' })
  iniciador: Usuario;

  @Column({ name: 'receptor_id' })
  receptorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'receptor_id' })
  receptor: Usuario;

  @Column({
    type: 'enum',
    enum: ModalidadIntercambio,
    enumName: 'modalidad_intercambio',
  })
  modalidad: ModalidadIntercambio;

  @Column({
    type: 'enum',
    enum: EstadoTransaccion,
    enumName: 'estado_transaccion',
    default: EstadoTransaccion.PENDIENTE,
  })
  estado: EstadoTransaccion;

  @Column({
    name: 'precio_acordado',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precioAcordado: number | null;

  @Column({ name: 'confirmacion_iniciador', type: 'boolean', default: false })
  confirmacionIniciador: boolean;

  @Column({ name: 'confirmacion_receptor', type: 'boolean', default: false })
  confirmacionReceptor: boolean;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;

  @Column({ name: 'fecha_completada', type: 'timestamptz', nullable: true })
  fechaCompletada: Date | null;
}
