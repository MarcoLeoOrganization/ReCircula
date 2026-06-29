import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcoController } from './arco.controller';
import { ArcoService } from './arco.service';
import { IdentityModule } from '../identity/identity.module';
import { Usuario } from '../identity/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    IdentityModule,
  ],
  controllers: [ArcoController],
  providers: [ArcoService],
})
export class ArcoModule {}
