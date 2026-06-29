import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

/**
 * Calificacion — RF-06.1
 * Una calificación por transacción por calificador (constraint UNIQUE).
 */
@Entity('calificaciones')
@Unique(['transaccionId', 'calificadorId'])
export class Calificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaccion_id' })
  transaccionId: string;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaccion_id' })
  transaccion: Transaction;

  @Column({ name: 'calificador_id' })
  calificadorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'calificador_id' })
  calificador: Usuario;

  @Column({ name: 'calificado_id' })
  calificadoId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'calificado_id' })
  calificado: Usuario;

  @Column({ type: 'smallint' })
  puntuacion: number;

  @Column({ name: 'resena', type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;
}
