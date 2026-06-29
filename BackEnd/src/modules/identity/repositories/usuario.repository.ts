import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repo.findOne({ where: { email } });
  }

  /** Trae el password_hash que normalmente está oculto con select:false */
  async findByEmailConHash(email: string): Promise<Usuario | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  async crear(datos: Partial<Usuario>): Promise<Usuario> {
    return this.repo.save(this.repo.create(datos));
  }

  async actualizarPorId(id: string, datos: Partial<Usuario>): Promise<void> {
    await this.repo.update(id, datos);
  }

  async crearPerfilReparadorVacio(usuarioId: string): Promise<void> {
    await this.repo.manager.query(
      `INSERT INTO perfiles_reparador (usuario_id, verificado, especialidades, puntuacion, reparaciones_documentadas)
       VALUES ($1, false, '{}', 0, 0)`,
      [usuarioId]
    );
  }
}
