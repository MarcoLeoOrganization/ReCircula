import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../../modules/identity/entities/usuario.entity';

export const ROLES_KEY = 'roles';

/**
 * RF-01.4 — Diferencia permisos por rol.
 * Usar siempre después de JwtAuthGuard (necesita req.user ya poblado).
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RolUsuario.ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    // Evitamos el 'any' tipando el request desde el inicio
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { rol: RolUsuario } }>();

    // Y verificamos de forma segura
    const tieneRol = rolesRequeridos.includes(request.user?.rol as RolUsuario);
    if (!tieneRol) {
      throw new ForbiddenException(
        'No tienes los permisos ni el rol requerido para realizar esta acción.',
      );
    }

    return true;
  }
}
