/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PublicationsRepository } from '../publications/repositories/publications.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  EstadoPublicacion,
  EstadoTransaccion,
  ModalidadIntercambio,
} from '../../common/types';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: TransactionsRepository;
  let publicationsRepo: PublicationsRepository;
  let eventEmitter: EventEmitter2;

  const mockTransactionsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    saveAuditLog: jest.fn(),
    updateEstado: jest.fn(),
    save: jest.fn((tx) => Promise.resolve(tx)),
  };

  const mockPublicationsRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
        {
          provide: PublicationsRepository,
          useValue: mockPublicationsRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repo = module.get<TransactionsRepository>(TransactionsRepository);
    publicationsRepo = module.get<PublicationsRepository>(
      PublicationsRepository,
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('proponer', () => {
    it('debe lanzar NotFoundException si la publicación no existe', async () => {
      mockPublicationsRepository.findById.mockResolvedValue(null);
      const dto: CreateTransactionDto = {
        publicacionId: 'pub-id',
        modalidad: ModalidadIntercambio.DONACION,
      };

      await expect(service.proponer(dto, 'iniciador-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si la publicación no está PUBLICADA', async () => {
      mockPublicationsRepository.findById.mockResolvedValue({
        id: 'pub-id',
        estado: EstadoPublicacion.BORRADOR,
      });
      const dto: CreateTransactionDto = {
        publicacionId: 'pub-id',
        modalidad: ModalidadIntercambio.DONACION,
      };

      await expect(service.proponer(dto, 'iniciador-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si el iniciador es el mismo publicador', async () => {
      mockPublicationsRepository.findById.mockResolvedValue({
        id: 'pub-id',
        estado: EstadoPublicacion.PUBLICADO,
        publicadorId: 'owner-id',
      });
      const dto: CreateTransactionDto = {
        publicacionId: 'pub-id',
        modalidad: ModalidadIntercambio.DONACION,
      };

      await expect(service.proponer(dto, 'owner-id')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockTransactionsRepository.create).not.toHaveBeenCalled();
      expect(mockTransactionsRepository.saveAuditLog).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si es venta y no se acuerda un precio', async () => {
      mockPublicationsRepository.findById.mockResolvedValue({
        id: 'pub-id',
        estado: EstadoPublicacion.PUBLICADO,
        publicadorId: 'owner-id',
      });
      const dto: CreateTransactionDto = {
        publicacionId: 'pub-id',
        modalidad: ModalidadIntercambio.VENTA,
      };

      await expect(service.proponer(dto, 'iniciador-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe crear la transacción, guardar log de auditoría y emitir evento si todo es válido', async () => {
      mockPublicationsRepository.findById.mockResolvedValue({
        id: 'pub-id',
        estado: EstadoPublicacion.PUBLICADO,
        publicadorId: 'owner-id',
        titulo: 'Articulo Prueba',
      });

      const mockTx = {
        id: 'tx-id',
        publicacionId: 'pub-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'owner-id',
        modalidad: ModalidadIntercambio.DONACION,
        estado: EstadoTransaccion.PENDIENTE,
      };

      mockTransactionsRepository.create.mockResolvedValue(mockTx);
      mockTransactionsRepository.findById.mockResolvedValue({
        ...mockTx,
        iniciador: { nombre: 'Juan' },
      });

      const dto: CreateTransactionDto = {
        publicacionId: 'pub-id',
        modalidad: ModalidadIntercambio.DONACION,
        notas: 'Me interesa',
      };

      const res = await service.proponer(dto, 'iniciador-id');

      expect(repo.create).toHaveBeenCalled();
      expect(repo.saveAuditLog).toHaveBeenCalledWith({
        transaccionId: 'tx-id',
        estadoAnterior: null,
        estadoNuevo: EstadoTransaccion.PENDIENTE,
        usuarioResponsableId: 'iniciador-id',
        notas: 'Trato propuesto',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'transaction.proposed',
        expect.anything(),
      );
      expect(res).toEqual(mockTx);
    });
  });

  describe('buscarPorId', () => {
    it('debe lanzar NotFoundException si la transacción no existe', async () => {
      mockTransactionsRepository.findById.mockResolvedValue(null);

      await expect(service.buscarPorId('tx-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException si el usuario no es iniciador ni receptor', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
      });

      await expect(service.buscarPorId('tx-id', 'externo-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe retornar la transacción si el usuario es miembro', async () => {
      const mockTx = {
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
      };
      mockTransactionsRepository.findById.mockResolvedValue(mockTx);

      const res = await service.buscarPorId('tx-id', 'iniciador-id');
      expect(res).toEqual(mockTx);
    });
  });

  describe('aceptar', () => {
    it('debe lanzar ForbiddenException si no es el receptor quien acepta', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.PENDIENTE,
      });

      await expect(service.aceptar('tx-id', 'iniciador-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar BadRequestException si la transacción no está PENDIENTE', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.EN_PROCESO,
      });

      await expect(service.aceptar('tx-id', 'receptor-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe aceptar, cambiar estados, registrar auditoría y emitir evento', async () => {
      const mockTx = {
        id: 'tx-id',
        publicacionId: 'pub-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.PENDIENTE,
        publicacion: { titulo: 'Articulo' },
        receptor: { nombre: 'Pedro' },
      };
      mockTransactionsRepository.findById.mockResolvedValue(mockTx);
      mockTransactionsRepository.save.mockResolvedValue(mockTx);

      await service.aceptar('tx-id', 'receptor-id');

      expect(publicationsRepo.update).toHaveBeenCalledWith('pub-id', {
        estado: EstadoPublicacion.RESERVADO,
      });
      expect(repo.saveAuditLog).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'transaction.accepted',
        expect.anything(),
      );
    });
  });

  describe('cancelar', () => {
    it('debe lanzar ForbiddenException si el usuario no pertenece a la transacción', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
      });

      await expect(
        service.cancelar('tx-id', 'externo-id', 'Razón'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si ya está COMPLETADA o CANCELADA', async () => {
      mockTransactionsRepository.findById.mockResolvedValue({
        id: 'tx-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.COMPLETADA,
      });

      await expect(
        service.cancelar('tx-id', 'iniciador-id', 'Razón'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe cancelar la transacción, restablecer publicación a PUBLICADO y loguear', async () => {
      const mockTx = {
        id: 'tx-id',
        publicacionId: 'pub-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.EN_PROCESO,
        publicacion: { titulo: 'Articulo' },
      };
      mockTransactionsRepository.findById.mockResolvedValue(mockTx);
      mockTransactionsRepository.save.mockResolvedValue(mockTx);

      await service.cancelar('tx-id', 'iniciador-id', 'Cancelado por usuario');

      expect(publicationsRepo.update).toHaveBeenCalledWith('pub-id', {
        estado: EstadoPublicacion.PUBLICADO,
      });
      expect(repo.saveAuditLog).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'transaction.canceled',
        expect.anything(),
      );
    });
  });

  describe('confirmar', () => {
    it('debe confirmar e intentar completar la transacción cuando ambas partes hayan confirmado', async () => {
      const mockTx = {
        id: 'tx-id',
        publicacionId: 'pub-id',
        iniciadorId: 'iniciador-id',
        receptorId: 'receptor-id',
        estado: EstadoTransaccion.EN_PROCESO,
        confirmacionIniciador: false,
        confirmacionReceptor: false,
        publicacion: { titulo: 'Articulo' },
      };

      mockTransactionsRepository.findById.mockResolvedValue(mockTx);

      mockTransactionsRepository.save.mockResolvedValue({
        ...mockTx,
        confirmacionIniciador: true,
        confirmacionReceptor: true,
      });

      await service.confirmar('tx-id', 'iniciador-id');

      expect(repo.save).toHaveBeenCalled();
      expect(publicationsRepo.update).toHaveBeenCalledWith('pub-id', {
        estado: EstadoPublicacion.INTERCAMBIADO,
      });
      expect(repo.saveAuditLog).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'transaction.completed',
        expect.anything(),
      );
    });
  });
});
