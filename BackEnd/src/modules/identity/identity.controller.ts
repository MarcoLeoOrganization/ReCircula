import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { IdentityService } from './identity.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from './entities/usuario.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Identity — RF-01')
@Controller('identity')
export class IdentityController {
  constructor(private readonly svc: IdentityService) {}

  // ── RF-01.1  Registro ─────────────────────────────────────────────────────
  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'RF-01.1 — Registro de nuevo usuario',
    description:
      'Crea la cuenta (inactiva) y envía un correo con el enlace de verificación. ' +
      'La cuenta solo se activa al hacer clic en el enlace.',
  })
  @ApiCreatedResponse({
    description: 'Usuario registrado. Correo de verificación enviado.',
  })
  @ApiConflictResponse({ description: 'El email ya está en uso.' })
  registrar(@Body() dto: RegisterDto) {
    return this.svc.registrar(dto);
  }

  // ── RF-01.1  Verificar email ──────────────────────────────────────────────
  @Public()
  @Get('verify-email')
  @ApiOperation({
    summary: 'RF-01.1 — Activar cuenta desde el enlace del correo',
    description:
      'El enlace expira en 24 h. Devuelve 400 si el token es inválido o expirado.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de 64 caracteres hex',
  })
  @ApiOkResponse({ description: 'Cuenta activada.' })
  @ApiBadRequestResponse({ description: 'Token inválido, usado o expirado.' })
  verificarEmail(@Query('token') token: string) {
    return this.svc.verificarEmail(token);
  }

  // ── RF-01.1  Reenviar verificación ───────────────────────────────────────
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'RF-01.1 — Reenviar enlace de verificación',
    description:
      'Siempre responde igual para no revelar si el email existe (seguridad).',
  })
  reenviarVerificacion(@Body('email') email: string) {
    return this.svc.reenviarVerificacion(email);
  }

  // ── RF-01.2  Login ────────────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'RF-01.2 — Inicio de sesión',
    description:
      'Devuelve el JWT con el tiempo de expiración configurado en JWT_EXPIRES_IN. ' +
      'La sesión queda registrada en BD para poder invalidarla con logout.',
  })
  @ApiOkResponse({ description: 'Login exitoso. Retorna usuario y token JWT.' })
  @ApiUnauthorizedResponse({
    description:
      'Credenciales inválidas / email no verificado / cuenta inactiva.',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    const { usuario, token } = await this.svc.login(dto, req.ip);
    
    return { usuario, token };
  }

  // ── RF-01.3  Solicitar recuperación ──────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'RF-01.3 — Solicitar enlace de recuperación de contraseña',
    description:
      'Siempre responde igual para no revelar si el email existe. Expira en 60 min.',
  })
  solicitarRecuperacion(@Body() dto: ForgotPasswordDto) {
    return this.svc.solicitarRecuperacion(dto);
  }

  // ── RF-01.3  Restablecer contraseña ──────────────────────────────────────
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'RF-01.3 — Restablecer contraseña con token',
    description:
      'Cambia el password e invalida todas las sesiones activas del usuario por seguridad.',
  })
  @ApiOkResponse({ description: 'Contraseña actualizada.' })
  @ApiBadRequestResponse({
    description: 'Token inválido, ya usado o expirado.',
  })
  restablecerPassword(@Body() dto: ResetPasswordDto) {
    return this.svc.restablecerPassword(dto);
  }

  // ── RF-01.5  Logout ───────────────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-01.5 — Cerrar sesión e invalidar JWT activo',
    description:
      'Marca la sesión como invalidada en BD. El token queda inutilizable aunque no haya expirado.',
  })
  @ApiOkResponse({ description: 'Sesión cerrada.' })
  logout(@Req() req: Request) {
    const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
    return this.svc.logout(token);
  }

  // ── RF-01.4  Perfil propio (diferenciado por rol) ────────────────────────
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-01.4 — Datos del usuario autenticado (cualquier rol)',
  })
  me(@CurrentUser() user: { id: string; email: string; rol: string }) {
    return user;
  }

  // ── RF-08  Rectificar perfil propio ────────────────────────────────────────
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-08 — Actualizar datos del usuario autenticado (Rectificación)',
  })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente.' })
  actualizarPerfil(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.svc.actualizarPerfil(user.id, dto);
  }

  // ── RF-01.4  Endpoint exclusivo de ADMINISTRADOR ──────────────────
  @Get('admin/dashboard')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-01.4 — Solo ADMINISTRADOR',
    description: 'Ejemplo de endpoint con control de acceso por rol.',
  })
  adminDashboard(@CurrentUser() user: { email: string; rol: string }) {
    return { mensaje: `Bienvenido al panel de administración, ${user.email}` };
  }

  // ── RF-01.4  Endpoint exclusivo de REPARADOR_VERIFICADO ─────────────
  @Get('reparador/perfil')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.REPARADOR_VERIFICADO, RolUsuario.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RF-01.4 — Solo REPARADOR_VERIFICADO o ADMINISTRADOR',
    description: 'Ejemplo de endpoint restringido a reparadores verificados.',
  })
  reparadorPerfil(@CurrentUser() user: { email: string; rol: string }) {
    return { mensaje: `Perfil de reparador: ${user.email}` };
  }
}
