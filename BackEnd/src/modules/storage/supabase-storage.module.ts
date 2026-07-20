import { Global, Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

/**
 * Módulo global de almacenamiento en Supabase Storage.
 * Al ser @Global(), SupabaseStorageService está disponible en toda la aplicación
 * sin necesidad de importar este módulo en cada módulo que lo use.
 */
@Global()
@Module({
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class SupabaseStorageModule {}
