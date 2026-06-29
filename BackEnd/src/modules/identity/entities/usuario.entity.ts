import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RolUsuario {
  USUARIO_GENERAL = 'USUARIO_GENERAL',
  REPARADOR_VERIFICADO = 'REPARADOR_VERIFICADO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 255, unique: true })
  email: string;

  /** bcrypt hash — select:false evita que salga en cualquier query normal */
  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.USUARIO_GENERAL,
    enumName: 'rol_usuario', // nombre del ENUM en postgres (ya existe en el schema)
  })
  rol: RolUsuario;

  @Column({ name: 'email_verificado', default: false })
  emailVerificado: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'permitir_matchmaking', default: true })
  permitirMatchmaking: boolean;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fechaRegistro: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;
}
