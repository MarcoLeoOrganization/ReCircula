import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductHistory } from './product-history.entity';
import { Usuario } from '../../identity/entities/usuario.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TipoEntradaHistorial } from '../../../common/types';

@Entity('entradas_historial')
export class HistoryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'historial_id', type: 'uuid' })
  historialId: string;

  @ManyToOne(() => ProductHistory, (hist) => hist.entradas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'historial_id' })
  historial: ProductHistory;

  @Column({
    type: 'enum',
    enum: TipoEntradaHistorial,
    enumName: 'tipo_entrada_historial',
  })
  tipo: TipoEntradaHistorial;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date | string;

  @Column({ name: 'reparador_id', type: 'uuid', nullable: true })
  reparadorId: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'reparador_id' })
  reparador: Usuario | null;

  @Column({ name: 'piezas_reemplazadas', type: 'text', array: true, default: '{}' })
  piezasReemplazadas: string[];

  @Column({ name: 'estado_resultante', type: 'varchar', length: 100, nullable: true })
  estadoResultante: string | null;

  @Column({ name: 'transaccion_id', type: 'uuid', nullable: true })
  transaccionId: string | null;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaccion_id' })
  transaccion: Transaction | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;
}
