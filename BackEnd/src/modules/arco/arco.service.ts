import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioRepository } from '../identity/repositories/usuario.repository';
import { MailService } from '../identity/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArcoService {
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async accesoDatos(usuarioId: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Aquí recopilamos la información. Como es una simulación de entrega, 
    // enviamos un correo indicando que se ha procesado la solicitud.
    const html = `
      <h2>Tus datos personales (Derecho de Acceso ARCO)</h2>
      <p>Hola ${usuario.nombre}, hemos recopilado tu información.</p>
      <ul>
        <li><strong>Email:</strong> ${usuario.email}</li>
        <li><strong>Rol:</strong> ${usuario.rol}</li>
        <li><strong>Matchmaking:</strong> ${usuario.permitirMatchmaking ? 'Permitido' : 'No permitido'}</li>
        <li><strong>Fecha de Registro:</strong> ${usuario.fechaRegistro}</li>
      </ul>
      <p>Para ver todas tus transacciones, puedes entrar a la plataforma y descargar tu historial.</p>
    `;

    // Llamamos a MailService
    await this.mailService.enviarDatosArco(usuario.email, html);
  }

  async oposicion(usuarioId: string, permitirMatchmaking: boolean): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    
    await this.usuarioRepo.actualizarPorId(usuarioId, { permitirMatchmaking });
  }

  async cancelarCuenta(usuarioId: string): Promise<void> {
    const usuario = await this.usuarioRepo.findById(usuarioId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Anonimización
    await this.usuarioRepo.actualizarPorId(usuarioId, {
      nombre: 'Usuario Eliminado',
      email: `eliminado_${usuario.id}@recircula.mx`,
      passwordHash: '',
      activo: false,
      permitirMatchmaking: false,
    });
  }
}
