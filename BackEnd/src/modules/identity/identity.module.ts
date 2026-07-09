import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entidades
import { Usuario } from './entities/usuario.entity';
import { Sesion } from './entities/sesion.entity';
import { TokenRecuperacion } from './entities/token-recuperacion.entity';

// Repositorios
import { UsuarioRepository } from './repositories/usuario.repository';
import { SesionRepository } from './repositories/sesion.repository';
import { TokenRecuperacionRepository } from './repositories/token-recuperacion.repository';

// Servicios y estrategia
import { IdentityService } from './identity.service';
import { MailService } from './mail.service';
import { JwtStrategy } from './jwt.strategy';
import { DataLifecycleService } from './data-lifecycle.service';

// Controlador
import { IdentityController } from './identity.controller';

@Module({
  imports: [
    // Registra las tres tablas del módulo
    TypeOrmModule.forFeature([Usuario, Sesion, TokenRecuperacion]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT configurado desde el namespace 'jwt' (config/jwt.config.ts)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [IdentityController],
  providers: [
    // Repositorios
    UsuarioRepository,
    SesionRepository,
    TokenRecuperacionRepository,
    // Servicios
    IdentityService,
    MailService,
    // Estrategia Passport-JWT
    JwtStrategy,
    DataLifecycleService,
  ],
  exports: [
    // Exportamos JwtModule y el service para que otros módulos puedan
    // inyectar el guard y verificar sesiones
    JwtModule,
    IdentityService,
    MailService,
    UsuarioRepository,
    SesionRepository,
    DataLifecycleService,
  ],
})
export class IdentityModule {}
