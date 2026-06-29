import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { HistoryRepository } from './repositories/history.repository';
import { PublicationsRepository } from '../publications/repositories/publications.repository';
import { ProductHistory } from './entities/product-history.entity';
import { HistoryEntry } from './entities/history-entry.entity';
import { TipoEntradaHistorial } from '../../common/types';
import { CreateEntryDto } from './dto/create-entry.dto';
import { EntityManager } from 'typeorm';
import { Usuario, RolUsuario } from '../identity/entities/usuario.entity';

@Injectable()
export class HistoryService {
  constructor(
    private readonly historyRepo: HistoryRepository,
    private readonly publicationsRepo: PublicationsRepository,
    private readonly entityManager: EntityManager,
  ) {}

  async getHistoryByPublicationId(publicationId: string): Promise<ProductHistory> {
    const pub = await this.publicationsRepo.findById(publicationId);
    if (!pub) {
      throw new NotFoundException('La publicación especificada no existe');
    }

    // Create the history if it doesn't exist yet
    let history = await this.historyRepo.findHistoryByPublicationId(publicationId);
    if (!history) {
      history = await this.historyRepo.createHistory(publicationId);
      history.entradas = [];
    }

    return history;
  }

  async registerExchangeEntry(
    publicationId: string,
    transaccionId: string,
    descripcion: string,
    iniciadorId: string,
    receptorId: string,
  ): Promise<HistoryEntry> {
    const history = await this.historyRepo.createHistory(publicationId);

    // Look up if either user has VENDEDOR_REPARADOR role to set as reparadorId
    let reparadorId: string | null = null;
    try {
      const users = await this.entityManager.createQueryBuilder(Usuario, 'u')
        .where('u.id IN (:...ids)', { ids: [iniciadorId, receptorId] })
        .getMany();
      const repairer = users.find((u) => u.rol === RolUsuario.VENDEDOR_REPARADOR);
      if (repairer) {
        reparadorId = repairer.id;
      }
    } catch (err) {
      // In case user lookup fails, fall back to null
    }

    return this.historyRepo.addEntry({
      historialId: history.id,
      tipo: TipoEntradaHistorial.INTERCAMBIO,
      descripcion,
      transaccionId,
      reparadorId,
      piezasReemplazadas: [],
      estadoResultante: null,
    });
  }

  async addRepairEntry(
    publicationId: string,
    reparadorId: string,
    dto: CreateEntryDto,
  ): Promise<HistoryEntry> {
    const pub = await this.publicationsRepo.findById(publicationId);
    if (!pub) {
      throw new NotFoundException('La publicación especificada no existe');
    }

    // Restricción de propiedad: solo el dueño puede registrar la reparación
    if (pub.publicadorId !== reparadorId) {
      throw new ForbiddenException(
        'Solo el propietario de la publicación puede registrar reparaciones sobre este artículo',
      );
    }

    const history = await this.historyRepo.createHistory(publicationId);

    return this.historyRepo.addEntry({
      historialId: history.id,
      tipo: TipoEntradaHistorial.REPARACION,
      descripcion: dto.descripcion,
      reparadorId,
      piezasReemplazadas: dto.piezasReemplazadas || [],
      estadoResultante: dto.estadoResultante || null,
    });
  }
}
