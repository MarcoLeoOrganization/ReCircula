import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearCalificacionDto {
  @ApiProperty({ description: 'UUID de la transacción completada que se califica' })
  @IsUUID()
  transaccionId: string;

  @ApiProperty({ description: 'Puntuación del 1 al 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  puntuacion: number;

  @ApiPropertyOptional({ description: 'Comentario opcional (máx. 500 caracteres)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
