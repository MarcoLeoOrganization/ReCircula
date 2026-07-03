import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import * as path from 'path';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── OWASP: Helmet (Cabeceras de Seguridad HSTS, XSS, etc) ───────────────
  app.use(helmet());

  // ── Prefijo global ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Compresión GZIP (RNF-01) ──────────────────────────────────────────────
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['accept']?.includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // ── Filtros y Pipes ───────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Servir estáticos (subidas) ───────────────────────────────────────────
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'public', 'uploads')),
  );

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerCfg = new DocumentBuilder()
    .setTitle('ReCircula API')
    .setDescription(
      'Backend de la plataforma de economía circular de electrónicos.\n\n' +
        '**RF-01** — Gestión de Identidad y Acceso está implementado bajo `/identity`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀  ReCircula API   → http://localhost:${port}/api/v1`);
  console.log(`📖  Swagger docs    → http://localhost:${port}/api/docs\n`);
}

bootstrap().catch((err) => console.error(err));
