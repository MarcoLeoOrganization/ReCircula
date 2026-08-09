import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoTransaccion } from '../../common/types';
import { Usuario } from '../identity/entities/usuario.entity';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionsRepository } from '../transactions/repositories/transactions.repository';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { Calificacion } from './entities/calificacion.entity';
import { ReputationService } from './reputation.service';
import { ReputationRepository } from './repositories/reputation.repository';

describe('ReputationService', () => {
  let service: ReputationService;

  const mockReputationRepository = {
    crearCalificacion: jest.fn(),
    findCalificacionByTxYCalificador: jest.fn(),
    getCalificacionesDeUsuario: jest.fn(),
    getPerfilReparador: jest.fn(),
    crearSolicitudVerificacion: jest.fn(),
    getSolicitudesPendientes: jest.fn(),
    findSolicitudById: jest.fn(),
    actualizarSolicitud: jest.fn(),
  };

  const mockTransactionsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findAllForUser: jest.fn(),
    saveAuditLog: jest.fn(),
  };

  const mockUsuariosRepository = {
    findOne: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: mockReputationRepository,
        },
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuariosRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: SupabaseStorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calificar', () => {
    it('CB-03: debe identificar a la contraparte y guardar la calificación', async () => {
      const transaccion = {
        id: 'tx-id',
        estado: EstadoTransaccion.COMPLETADA,
        iniciadorId: 'user-a',
        receptorId: 'user-b',
      } as Transaction;

      const dto: CrearCalificacionDto = {
        transaccionId: 'tx-id',
        puntuacion: 5,
        comentario: 'Intercambio realizado correctamente',
      };

      const calificacionCreada = {
        id: 'rating-id',
        transaccionId: 'tx-id',
        calificadorId: 'user-a',
        calificadoId: 'user-b',
        puntuacion: 5,
        comentario: 'Intercambio realizado correctamente',
      } as Calificacion;

      mockTransactionsRepository.findById.mockResolvedValue(transaccion);
      mockReputationRepository.findCalificacionByTxYCalificador.mockResolvedValue(
        null,
      );
      mockReputationRepository.crearCalificacion.mockResolvedValue(
        calificacionCreada,
      );
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'user-a',
        nombre: 'Usuario A',
      });

      const resultado = await service.calificar(dto, 'user-a');

      expect(mockTransactionsRepository.findById).toHaveBeenCalledWith('tx-id');
      expect(
        mockReputationRepository.findCalificacionByTxYCalificador,
      ).toHaveBeenCalledWith('tx-id', 'user-a');
      expect(mockReputationRepository.crearCalificacion).toHaveBeenCalledWith({
        transaccionId: 'tx-id',
        calificadorId: 'user-a',
        calificadoId: 'user-b',
        puntuacion: 5,
        comentario: 'Intercambio realizado correctamente',
      });
      expect(resultado).toEqual(calificacionCreada);
    });
  });
});
