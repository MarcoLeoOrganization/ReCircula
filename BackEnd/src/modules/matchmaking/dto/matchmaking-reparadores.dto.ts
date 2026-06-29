import {
  IsLatitude, IsLongitude, IsString,
  IsNotEmpty, IsOptional, IsNumber, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchmakingReparadoresDto {
  @ApiProperty({ example: 20.9200, description: 'Latitud del artículo / usuario' })
  @IsLatitude()
  @Type(() => Number)
  latitud: number;

  @ApiProperty({ example: -101.3500, description: 'Longitud del artículo / usuario' })
  @IsLongitude()
  @Type(() => Number)
  longitud: number;

  @ApiProperty({ example: 'Smartphones y Tablets', description: 'Categoría del artículo a reparar' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiPropertyOptional({ example: 20, description: 'Radio de búsqueda en km (5–50)', minimum: 5, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  @Type(() => Number)
  radioKm?: number = 20;
}
