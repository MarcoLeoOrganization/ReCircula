import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'linux123',
    database: process.env.DB_NAME ?? process.env.DB_DATABASE ?? 'ReCircula',
    autoLoadEntities: true,
    synchronize: false, // ⚠️ El schema ya existe — no tocar con sync
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  }),
);
