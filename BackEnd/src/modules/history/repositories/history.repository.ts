import { ProductHistory } from '../entities/product-history.entity';
import { HistoryEntry } from '../entities/history-entry.entity';

export abstract class HistoryRepository {
  abstract findHistoryByPublicationId(publicationId: string): Promise<ProductHistory | null>;
  abstract createHistory(publicationId: string): Promise<ProductHistory>;
  abstract addEntry(entry: Partial<HistoryEntry>): Promise<HistoryEntry>;
}
