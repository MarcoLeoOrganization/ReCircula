import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionAudit } from './entities/transaction-audit.entity';
import { PublicationsModule } from '../publications/publications.module';
import { HistoryModule } from '../history/history.module';
import { TransactionsRepository } from './repositories/transactions.repository';
import { TypeOrmTransactionsRepository } from './repositories/typeorm-transactions.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionAudit]),
    PublicationsModule,
    HistoryModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    {
      provide: TransactionsRepository,
      useClass: TypeOrmTransactionsRepository,
    },
  ],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
