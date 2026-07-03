import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Sse,
  MessageEvent,
  Req,
  Res,
} from '@nestjs/common';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('RF-07 — Notificaciones')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly svc: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── RF-07 — Flujo SSE en tiempo real (Latencia <= 2s) ───────────────────────
  @Get('stream')
  @ApiOperation({ summary: 'RF-07 — Stream en tiempo real de notificaciones (SSE)' })
  stream(@CurrentUser() user: { id: string }, @Req() req: any, @Res() res: any) {
    console.log(`[SSE] Cliente conectado: ${user.id}`);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx / proxies
    res.flushHeaders();

    const listener = (notif: any) => {
      console.log(`[SSE] Evaluando notif para ${notif.destinatarioId} vs conectada: ${user.id}`);
      if (notif.destinatarioId === user.id) {
        console.log(`[SSE] Enviando notif a ${user.id}`);
        res.write(`data: ${JSON.stringify(notif)}\n\n`);
        if (typeof res.flush === 'function') res.flush();
      }
    };
    
    this.eventEmitter.on('notification.created', listener);
    
    const interval = setInterval(() => {
      res.write(`data: {"type":"ping"}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    }, 15000);
    
    req.on('close', () => {
      console.log(`[SSE] Cliente desconectado: ${user.id}`);
      this.eventEmitter.off('notification.created', listener);
      clearInterval(interval);
      res.end();
    });
  }

  // ── RF-07 — Obtener mis notificaciones ────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'RF-07 — Listar todas las notificaciones del usuario logueado' })
  async listar(@CurrentUser() user: { id: string }) {
    return this.svc.obtenerMisNotificaciones(user.id);
  }

  // ── RF-07 — Contar no leídas (para la campanita) ──────────────────────────────
  @Get('count')
  @ApiOperation({ summary: 'RF-07 — Número de notificaciones no leídas' })
  async contarNoLeidas(@CurrentUser() user: { id: string }) {
    return this.svc.contarNoLeidas(user.id);
  }

  // ── RF-07 — Marcar todas como leídas ─────────────────────────────────────────
  @Patch('read-all')
  @ApiOperation({ summary: 'RF-07 — Marcar todas las notificaciones como leídas' })
  async marcarTodas(@CurrentUser() user: { id: string }) {
    return this.svc.marcarTodasLeidas(user.id);
  }

  // ── RF-07 — Marcar una notificación como leída ────────────────────────────────
  @Patch(':id/read')
  @ApiOperation({ summary: 'RF-07 — Marcar una notificación específica como leída' })
  async marcarUna(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.marcarLeida(id, user.id);
  }
}
