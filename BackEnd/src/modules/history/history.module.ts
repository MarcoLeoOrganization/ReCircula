import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { ProductHistory } from './entities/product-history.entity';
import { HistoryEntry } from './entities/history-entry.entity';
import { HistoryRepository } from './repositories/history.repository';
import { TypeOrmHistoryRepository } from './repositories/typeorm-history.repository';
import { PublicationsModule } from '../publications/publications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductHistory, HistoryEntry]),
    PublicationsModule,
  ],
  controllers: [HistoryController],
  providers: [
    HistoryService,
    {
      provide: HistoryRepository,
      useClass: TypeOrmHistoryRepository,
    },
  ],
  exports: [HistoryService, HistoryRepository],
})
export class HistoryModule {}
