import {
  IsLatitude, IsLongitude, IsOptional,
  IsNumber, IsString, IsEnum, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ModalidadIntercambio } from '../../../common/types';

export class BuscarPublicacionesDto {
  @ApiPropertyOptional({ example: 20.9200, description: 'Latitud del usuario' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitud?: number;

  @ApiPropertyOptional({ example: -101.3500, description: 'Longitud del usuario' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitud?: number;

  @ApiPropertyOptional({ example: 10, description: 'Radio de búsqueda en km (5–50)', minimum: 5, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  @Type(() => Number)
  radioKm?: number = 10;

  @ApiPropertyOptional({ example: 'Smartphones y Tablets' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ enum: ModalidadIntercambio })
  @IsOptional()
  @IsEnum(ModalidadIntercambio)
  modalidad?: ModalidadIntercambio;
}
