import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { Calificacion } from './entities/calificacion.entity';
import { SolicitudVerificacion } from './entities/solicitud-verificacion.entity';
import { ReputationRepository } from './repositories/reputation.repository';
import { TypeOrmReputationRepository } from './repositories/typeorm-reputation.repository';
import { TransactionsModule } from '../transactions/transactions.module';
import { Usuario } from '../identity/entities/usuario.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Calificacion, SolicitudVerificacion, Usuario]),
    // Importamos TransactionsModule para reutilizar TransactionsRepository
    // y verificar el estado de la transacción antes de calificar
    TransactionsModule,
  ],
  controllers: [ReputationController],
  providers: [
    ReputationService,
    {
      provide: ReputationRepository,
      useClass: TypeOrmReputationRepository,
    },
  ],
  exports: [ReputationService],
})
export class ReputationModule {}
