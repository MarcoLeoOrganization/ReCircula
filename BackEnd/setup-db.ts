import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function setup() {
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('🔌 Conectado a base de datos "postgres"...');

    console.log('Terminando conexiones activas y eliminando base de datos "ReCircula" si existe...');
    await adminClient.query(`
      REVOKE CONNECT ON DATABASE "ReCircula" FROM public;
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'ReCircula' AND pid <> pg_backend_pid();
    `).catch(() => {});
    await adminClient.query('DROP DATABASE IF EXISTS "ReCircula";');

    console.log('Creando base de datos "ReCircula"...');
    await adminClient.query('CREATE DATABASE "ReCircula";');
    console.log('Base de datos "ReCircula" creada.');
  } catch (error) {
    console.error('Error al conectar a postgres / crear base de datos:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Conectar a ReCircula y ejecutar schema.sql
  const dbClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'ReCircula',
  });

  try {
    await dbClient.connect();
    console.log('🔌 Conectado a base de datos "ReCircula".');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo schema.sql en: ${schemaPath}`);
    }

    console.log('📜 Leyendo y ejecutando schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar todo el script SQL
    await dbClient.query(schemaSql);
    console.log('✅ Tablas, tipos, funciones y vistas creados exitosamente.');
  } catch (error) {
    console.error('❌ Error al ejecutar el schema:', error);
  } finally {
    await dbClient.end();
  }
}

setup();
