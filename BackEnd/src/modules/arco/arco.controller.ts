import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArcoService } from './arco.service';
import type { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('arco')
export class ArcoController {
  constructor(private readonly arcoService: ArcoService) {}

  @Get('acceso')
  async solicitarAcceso(@Req() req: Request) {
    const user = req.user as any;
    await this.arcoService.accesoDatos(user.id);
    return { message: 'Tus datos han sido enviados al correo registrado en un plazo máximo de 20 días (simulado inmediatamente).' };
  }

  @Patch('oposicion')
  async oponerMatchmaking(
    @Req() req: Request,
    @Body() body: { permitirMatchmaking: boolean },
  ) {
    const user = req.user as any;
    await this.arcoService.oposicion(user.id, body.permitirMatchmaking);
    return { message: 'Preferencias de privacidad actualizadas correctamente.' };
  }

  @Post('cancelar')
  async cancelarCuenta(@Req() req: Request) {
    const user = req.user as any;
    await this.arcoService.cancelarCuenta(user.id);
    return { message: 'Tu cuenta ha sido cancelada y tus datos anonimizados exitosamente.' };
  }
}
