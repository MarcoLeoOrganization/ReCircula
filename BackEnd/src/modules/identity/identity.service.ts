import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsuarioRepository } from './repositories/usuario.repository';
import { SesionRepository } from './repositories/sesion.repository';
import { TokenRecuperacionRepository } from './repositories/token-recuperacion.repository';
import { MailService } from './mail.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RolUsuario } from './entities/usuario.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sesiones: SesionRepository,
    private readonly tokens: TokenRecuperacionRepository,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.1  Registro con verificación de correo
  // ────────────────────────────────────────────────────────────────────────────
  //  async registrar(dto: RegisterDto: string) {
  async registrar(dto: RegisterDto) {
    const existe = await this.usuarios.findByEmail(dto.email);
    if (existe) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const usuario = await this.usuarios.crear({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      rol: dto.rol,
      emailVerificado: false,
      activo: false, // inactivo hasta verificar correo
    });

    if (dto.rol === RolUsuario.REPARADOR_VERIFICADO) {
      await this.usuarios.crearPerfilReparadorVacio(usuario.id);
    }

    const tokenPlano = await this.generarTokenVerificacion(usuario.id);
    await this.mail.enviarVerificacion(
      usuario.email,
      usuario.nombre,
      tokenPlano,
    );

    this.logger.log(`Registro: ${usuario.email} — pendiente de verificación`);
    return {
      mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
      usuarioId: usuario.id,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.1  Verificar email desde el enlace del correo
  // ────────────────────────────────────────────────────────────────────────────
  async verificarEmail(tokenPlano: string) {
    const tokenHash = this.hash(tokenPlano);
    const registro = await this.tokens.findValidoPorHash(tokenHash);

    if (!registro)
      throw new BadRequestException('Token inválido o ya utilizado');

    if (new Date() > registro.fechaExpiracion)
      throw new BadRequestException('El enlace expiró. Solicita uno nuevo.');

    await this.usuarios.actualizarPorId(registro.usuarioId, {
      emailVerificado: true,
      activo: true,
    });
    await this.tokens.marcarUsado(registro.id);

    this.logger.log(`Email verificado: ${registro.usuario.email}`);
    return { mensaje: 'Cuenta verificada. Ya puedes iniciar sesión.' };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.1  Reenviar correo de verificación
  // ────────────────────────────────────────────────────────────────────────────
  async reenviarVerificacion(email: string) {
    const resp = {
      mensaje: 'Si el correo existe y no está verificado, recibirás un enlace.',
    };
    const usuario = await this.usuarios.findByEmail(email);
    if (!usuario || usuario.emailVerificado) return resp;

    const tokenPlano = await this.generarTokenVerificacion(usuario.id);
    await this.mail.enviarVerificacion(
      usuario.email,
      usuario.nombre,
      tokenPlano,
    );
    return resp;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.2  Login — autenticación y emisión de JWT
  // ────────────────────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.2  Login — autenticación y emisión de JWT
  // ────────────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string) {
    const usuario = await this.usuarios.findByEmailConHash(dto.email);

    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const hashValido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!hashValido) throw new UnauthorizedException('Credenciales inválidas');

    if (!usuario.emailVerificado)
      throw new UnauthorizedException(
        'Verifica tu correo antes de iniciar sesión',
      );

    if (!usuario.activo)
      throw new UnauthorizedException(
        'Cuenta desactivada. Contacta al administrador.',
      );

    const token = this.firmarToken(usuario);
    await this.registrarSesion(usuario.id, token, ip);

    // En lugar de usar la variable '_' que enoja al linter, construimos el objeto limpio
    const datosUsuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    this.logger.log(`Login: ${usuario.email} (${usuario.rol})`);
    return { usuario: datosUsuario, token };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.3  Solicitar enlace de recuperación de contraseña
  // ────────────────────────────────────────────────────────────────────────────
  async solicitarRecuperacion(dto: ForgotPasswordDto) {
    // Respuesta genérica siempre — no revelar si el email existe
    const resp = {
      mensaje:
        'Si el correo está registrado, recibirás un enlace de recuperación.',
    };

    const usuario = await this.usuarios.findByEmail(dto.email);
    if (!usuario || !usuario.activo) return resp;

    await this.tokens.invalidarPreviosDeUsuario(usuario.id);

    const expiresMin = this.config.get<number>('mail.recoveryExpiresMin', 60);
    const fechaExpiracion = new Date(Date.now() + expiresMin * 60_000);
    const tokenPlano = crypto.randomBytes(32).toString('hex');

    await this.tokens.crear({
      usuarioId: usuario.id,
      tokenHash: this.hash(tokenPlano),
      fechaExpiracion,
    });

    await this.mail.enviarRecuperacion(
      usuario.email,
      usuario.nombre,
      tokenPlano,
    );
    this.logger.log(`Token recuperación generado: ${usuario.email}`);
    return resp;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.3  Restablecer contraseña con el token del correo
  // ────────────────────────────────────────────────────────────────────────────
  async restablecerPassword(dto: ResetPasswordDto) {
    const registro = await this.tokens.findValidoPorHash(this.hash(dto.token));

    if (!registro)
      throw new BadRequestException('Token inválido o ya utilizado');

    if (new Date() > registro.fechaExpiracion)
      throw new BadRequestException('El enlace expiró. Solicita uno nuevo.');

    const passwordHash = await bcrypt.hash(dto.nuevaPassword, 12);
    await this.usuarios.actualizarPorId(registro.usuarioId, { passwordHash });

    // Seguridad: invalidar token y todas las sesiones activas del usuario
    await this.tokens.marcarUsado(registro.id);
    await this.sesiones.invalidarTodasDeUsuario(registro.usuarioId);

    this.logger.log(`Contraseña restablecida: ${registro.usuario.email}`);
    return {
      mensaje: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RF-01.5  Logout — invalida el JWT activo en BD
  // ────────────────────────────────────────────────────────────────────────────
  async logout(tokenPlano: string) {
    const tokenHash = this.hash(tokenPlano);
    const sesion = await this.sesiones.findByTokenHash(tokenHash);

    if (sesion && !sesion.invalidado) {
      await this.sesiones.invalidar(sesion.id);
    }

    return { mensaje: 'Sesión cerrada correctamente.' };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Usado por JwtStrategy para validar que el token no fue invalidado (RF-01.5)
  // ────────────────────────────────────────────────────────────────────────────
  async esSesionValida(tokenHash: string): Promise<boolean> {
    return this.sesiones.esSesionValida(tokenHash);
  }

  // ── Helpers privados ────────────────────────────────────────────────────────

  private firmarToken(usuario: Usuario): string {
    return this.jwt.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
  }

  private async registrarSesion(
    usuarioId: string,
    token: string,
    ip?: string,
  ): Promise<void> {
    const tokenHash = this.hash(token);

    const decoded = this.jwt.decode(token);

    // 👇 Usamos notación de corchetes ['exp'] para calmar al linter
    const exp =
      typeof decoded === 'object' && decoded !== null && 'exp' in decoded
        ? Number((decoded as Record<string, unknown>)['exp'])
        : 0;

    const fechaExpiracion = new Date(exp * 1000);

    await this.sesiones.crear({
      usuarioId,
      tokenHash,
      fechaExpiracion,
      ipOrigen: ip ?? null,
    });
  }
  private async generarTokenVerificacion(usuarioId: string): Promise<string> {
    await this.tokens.invalidarPreviosDeUsuario(usuarioId);

    const expiresMin = this.config.get<number>('mail.verifyExpiresMin', 1440);
    const fechaExpiracion = new Date(Date.now() + expiresMin * 60_000);
    const tokenPlano = crypto.randomBytes(32).toString('hex');

    await this.tokens.crear({
      usuarioId,
      tokenHash: this.hash(tokenPlano),
      fechaExpiracion,
    });

    return tokenPlano;
  }

  /** SHA-256 hex — los tokens nunca se guardan en claro */
  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
