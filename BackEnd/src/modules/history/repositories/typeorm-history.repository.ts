import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductHistory } from '../entities/product-history.entity';
import { HistoryEntry } from '../entities/history-entry.entity';
import { HistoryRepository } from './history.repository';

@Injectable()
export class TypeOrmHistoryRepository implements HistoryRepository {
  constructor(
    @InjectRepository(ProductHistory)
    private readonly historyRepo: Repository<ProductHistory>,
    @InjectRepository(HistoryEntry)
    private readonly entryRepo: Repository<HistoryEntry>,
  ) {}

  async findHistoryByPublicationId(publicationId: string): Promise<ProductHistory | null> {
    const history = await this.historyRepo.findOne({
      where: { publicacionId: publicationId },
      relations: {
        entradas: {
          reparador: true,
          transaccion: true,
        },
      },
    });

    if (history && history.entradas) {
      // Sort entries by fechaCreacion DESC
      history.entradas.sort(
        (a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime(),
      );
    }

    return history;
  }

  async createHistory(publicationId: string): Promise<ProductHistory> {
    // Check if it already exists
    let history = await this.historyRepo.findOne({ where: { publicacionId: publicationId } });
    if (!history) {
      history = this.historyRepo.create({ publicacionId: publicationId });
      history = await this.historyRepo.save(history);
    }
    return history;
  }

  async addEntry(entry: Partial<HistoryEntry>): Promise<HistoryEntry> {
    const newEntry = this.entryRepo.create(entry);
    return this.entryRepo.save(newEntry);
  }
}
