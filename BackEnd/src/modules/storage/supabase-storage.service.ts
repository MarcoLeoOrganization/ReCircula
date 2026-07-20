import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Servicio global para subir y eliminar archivos en Supabase Storage.
 * Usa la Service Role Key para evitar restricciones de RLS en los buckets.
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas para el almacenamiento de archivos.',
      );
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Sube un archivo a un bucket de Supabase Storage.
   * @returns URL pública del archivo subido.
   */
  async uploadFile(
    bucket: string,
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, buffer, { contentType: mimetype, upsert: false });

    if (error) {
      this.logger.error(
        `Error subiendo a Supabase [${bucket}/${filename}]: ${error.message}`,
      );
      throw new Error(
        `Error al subir archivo a Supabase Storage: ${error.message}`,
      );
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  /**
   * Elimina un archivo de un bucket de Supabase Storage.
   */
  async deleteFile(bucket: string, filename: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filename]);
    if (error) {
      this.logger.warn(
        `Error eliminando de Supabase [${bucket}/${filename}]: ${error.message}`,
      );
    }
  }
}
