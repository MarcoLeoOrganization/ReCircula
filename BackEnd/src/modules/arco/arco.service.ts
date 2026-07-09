import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioRepository } from '../identity/repositories/usuario.repository';
import { SesionRepository } from '../identity/repositories/sesion.repository';
import { MailService } from '../identity/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArcoService {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly sesionRepo: SesionRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async accesoDatos(usuarioId: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Aquí recopilamos la información. Como es una simulación de entrega,
    // 3. Formatear datos para la plantilla
    const datosArco = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      permitirMatchmaking: usuario.permitirMatchmaking,
      fechaRegistro: usuario.fechaRegistro.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    // 4. Enviar correo usando el MailService
    await this.mailService.enviarDatosArco(usuario.email, datosArco);
  }

  async oposicion(
    usuarioId: string,
    permitirMatchmaking: boolean,
  ): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.usuarioRepo.actualizarPorId(usuarioId, { permitirMatchmaking });
  }

  async cancelarCuenta(usuarioId: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // 1. Invalidar todas las sesiones activas del usuario
    await this.sesionRepo.invalidarTodasDeUsuario(usuarioId);

    // 2. Anonimización
    await this.usuarioRepo.actualizarPorId(usuarioId, {
      nombre: 'Usuario Eliminado',
      email: `eliminado_${usuario.id}@recircula.mx`,
      passwordHash: '',
      activo: false,
      permitirMatchmaking: false,
    });
  }
}
