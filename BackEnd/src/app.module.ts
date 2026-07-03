import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import { RequireHttpsMiddleware } from './common/middlewares/require-https.middleware';

// Módulos de negocio
import { IdentityModule } from './modules/identity/identity.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { HistoryModule } from './modules/history/history.module';

import { MatchmakingModule }    from './modules/matchmaking/matchmaking.module';
import { ReputationModule }     from './modules/reputation/reputation.module';
import { NotificationsModule }  from './modules/notifications/notifications.module';
import { ArcoModule } from './modules/arco/arco.module';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // ── OWASP: Rate Limiting ─────────────────────────────────────────────────
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 peticiones por minuto
    }]),

    // ── Variables de entorno (.env) ──────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig],
    }),

    // ── Tareas programadas (Cron Jobs) ───────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Eventos internos (SSE) ──────────────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── TypeORM conectado a PostgreSQL (schema ya existente) ─────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const dbConfig = config.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('La configuración de base de datos no existe');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // ── RF-01: Gestión de identidad y acceso ─────────────────────────────────
    IdentityModule,

    // ── RF-02: Gestión de publicaciones y artículos ──────────────────────────
    PublicationsModule,

    // ── RF-03: Matchmaking geoespacial ───────────────────────────────────────
    MatchmakingModule,

    // ── RF-04: Gestión de transacciones e intercambios ───────────────────────
    TransactionsModule,

    // ── RF-06: Calificación y reputación ─────────────────────────────────────
    ReputationModule,

    // ── RF-07: Notificaciones ────────────────────────────────────────────────
    NotificationsModule,

    // ── RF-08: Derechos ARCO del Usuario ─────────────────────────────────────
    ArcoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequireHttpsMiddleware).forRoutes('*');
  }
}
