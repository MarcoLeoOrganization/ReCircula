import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilReparador } from './entities/perfil-reparador.entity';
import { MatchmakingRepository } from './repositories/matchmaking.repository';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';

@Module({
  imports: [
    // Registramos PerfilReparador para que TypeORM lo incluya en autoLoadEntities
    TypeOrmModule.forFeature([PerfilReparador]),
  ],
  controllers: [MatchmakingController],
  providers: [
    MatchmakingRepository,
    MatchmakingService,
  ],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
