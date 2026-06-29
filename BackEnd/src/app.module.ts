import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';

// Módulos de negocio
import { IdentityModule } from './modules/identity/identity.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

import { MatchmakingModule }    from './modules/matchmaking/matchmaking.module';
import { ReputationModule }     from './modules/reputation/reputation.module';
// import { HistoryModule }        from './modules/history/history.module';
// import { NotificationsModule }  from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ── Variables de entorno (.env) ──────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig],
    }),

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

    // ── RF-06: Sistema de Reputación y Verificación ──────────────────────────
    ReputationModule,
  ],
})
export class AppModule {}
