import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('mail.host'),
      port: config.get<number>('mail.port'),
      auth: {
        // 👇 ¡Nota cómo quitamos el '.auth' de aquí!
        user: config.get<string>('mail.user'),
        pass: config.get<string>('mail.pass'),
      },
      logger: true, // Imprime la conexión en consola (demostración de seguridad)
      debug: true,  // Imprime el handshake SMTP y TLS
    });
  }

  // ── RF-01.1 ───────────────────────────────────────────────────────────────
  async enviarVerificacion(
    to: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontUrl = 'https://localhost:5173'; // Redirigir al Frontend
    const enlace = `${frontUrl}/verify-email?token=${token}`;
    await this.send(
      to,
      'Verifica tu cuenta en ReCircula',
      this.tplVerificacion(nombre, enlace),
    );
  }

  // ── RF-01.3 ───────────────────────────────────────────────────────────────
  async enviarRecuperacion(
    to: string,
    nombre: string,
    token: string,
  ): Promise<void> {
    const frontUrl = 'https://localhost:5173'; // Redirigir al Frontend
    const enlace = `${frontUrl}/reset-password?token=${token}`;
    await this.send(
      to,
      'Recupera tu contraseña de ReCircula',
      this.tplRecuperacion(nombre, enlace),
    );
  }

  // ── RF-08 ───────────────────────────────────────────────────────────────
  async enviarDatosArco(to: string, usuario: any): Promise<void> {
    await this.send(to, 'Tus datos personales (Derecho de Acceso ARCO)', this.tplDatosArco(usuario));
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const from = this.config.get<string>('mail.from');

      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      const messageId = info.messageId;

      this.logger.log(`Correo enviado → ${to} | id: ${messageId}`);
    } catch (err) {
      this.logger.error(`Error enviando correo a ${to}`, err);
    }
  }

  private tplVerificacion(nombre: string, enlace: string): string {
    return `<!DOCTYPE html><html lang="es"><body
      style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#2C2C2A">
      <h2 style="color:#534AB7">¡Bienvenido a ReCircula, ${nombre}!</h2>
      <p>Haz clic en el botón para activar tu cuenta:</p>
      <a href="${enlace}" style="display:inline-block;margin:24px 0;padding:12px 28px;
         background:#534AB7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
        Verificar mi cuenta
      </a>
      <p style="color:#888;font-size:13px">El enlace expira en 24 horas.</p>
      <p style="color:#aaa;font-size:12px">ReCircula · Economía circular de tecnología</p>
    </body></html>`;
  }

  private tplRecuperacion(nombre: string, enlace: string): string {
    return `<!DOCTYPE html><html lang="es"><body
      style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#2C2C2A">
      <h2 style="color:#534AB7">Recupera tu contraseña, ${nombre}</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${enlace}" style="display:inline-block;margin:24px 0;padding:12px 28px;
         background:#993556;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
        Restablecer contraseña
      </a>
      <p style="color:#888;font-size:13px">El enlace expira en <strong>60 minutos</strong>.</p>
      <p style="color:#aaa;font-size:12px">ReCircula · Economía circular de tecnología</p>
    </body></html>`;
  }

  private tplDatosArco(usuario: any): string {
    return `<!DOCTYPE html><html lang="es"><body
      style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#2C2C2A">
      <h2 style="color:#2D6A4F">Tus datos personales, ${usuario.nombre}</h2>
      <p>Hemos recopilado la información asociada a tu cuenta (Derecho de Acceso ARCO):</p>
      <ul style="background:#f4f4f4;padding:20px;border-radius:8px;list-style:none;margin:24px 0;line-height:1.6">
        <li style="margin-bottom:8px"><strong>Email:</strong> ${usuario.email}</li>
        <li style="margin-bottom:8px"><strong>Rol:</strong> ${usuario.rol}</li>
        <li style="margin-bottom:8px"><strong>Matchmaking:</strong> ${usuario.permitirMatchmaking ? 'Permitido' : 'No permitido'}</li>
        <li><strong>Fecha de Registro:</strong> ${usuario.fechaRegistro}</li>
      </ul>
      <p style="color:#888;font-size:13px">Para ver todas tus transacciones, puedes entrar a la plataforma y descargar tu historial.</p>
      <p style="color:#aaa;font-size:12px">ReCircula · Economía circular de tecnología</p>
    </body></html>`;
  }
}
