import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { TransactionAudit } from '../entities/transaction-audit.entity';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TypeOrmTransactionsRepository implements TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
    @InjectRepository(TransactionAudit)
    private readonly auditRepo: Repository<TransactionAudit>,
  ) {}

  async create(datos: Partial<Transaction>): Promise<Transaction> {
    const tx = this.repo.create(datos);
    return this.repo.save(tx);
  }

  async save(tx: Transaction): Promise<Transaction> {
    return this.repo.save(tx);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        publicacion: { publicador: true },
        iniciador: true,
        receptor: true,
      },
    });
  }

  async findAllForUser(userId: string): Promise<Transaction[]> {
    // Retorna todas las transacciones donde el usuario es el iniciador o el receptor
    return this.repo.find({
      where: [{ iniciadorId: userId }, { receptorId: userId }],
      relations: {
        publicacion: { publicador: true },
        iniciador: true,
        receptor: true,
        calificaciones: true,
      },
      order: {
        fechaCreacion: 'DESC',
      },
    });
  }

  async saveAuditLog(
    audit: Partial<TransactionAudit>,
  ): Promise<TransactionAudit> {
    const row = this.auditRepo.create(audit);
    return this.auditRepo.save(row);
  }
}
