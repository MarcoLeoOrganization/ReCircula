import { IsString, IsNotEmpty, IsOptional, IsArray, Length } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 1000)
  descripcion: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  piezasReemplazadas?: string[];

  @IsString()
  @IsOptional()
  @Length(2, 100)
  estadoResultante?: string;
}
