import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SolicitarVerificacionDto {
  @ApiPropertyOptional({ description: 'Descripción de la experiencia y reparaciones previas (máx. 1000 caracteres)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
