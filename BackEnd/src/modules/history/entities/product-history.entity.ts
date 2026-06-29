import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Publication } from '../../publications/entities/publication.entity';
import { HistoryEntry } from './history-entry.entity';

@Entity('historial_producto')
export class ProductHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'publicacion_id', type: 'uuid', unique: true })
  publicacionId: string;

  @OneToOne(() => Publication)
  @JoinColumn({ name: 'publicacion_id' })
  publicacion: Publication;

  @OneToMany(() => HistoryEntry, (entry) => entry.historial)
  entradas: HistoryEntry[];

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;
}
