import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { EstadoPublicacion, ModalidadIntercambio } from '../../common/types';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { Publication } from './entities/publication.entity';
import { PublicationsService } from './publications.service';
import { PublicationsRepository } from './repositories/publications.repository';

describe('PublicationsService', () => {
  let service: PublicationsService;

  const mockPublicationsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  const mockEntityManager = {
    query: jest.fn(),
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
        PublicationsService,
        {
          provide: PublicationsRepository,
          useValue: mockPublicationsRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
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

    service = module.get<PublicationsService>(PublicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actualizar', () => {
    it('CB-02: debe rechazar el cambio a VENTA cuando no se proporciona precio', async () => {
      const publicacion = {
        id: 'pub-id',
        publicadorId: 'owner-id',
        estado: EstadoPublicacion.PUBLICADO,
        modalidad: ModalidadIntercambio.DONACION,
        precio: null,
      } as Publication;

      const dto: UpdatePublicationDto = {
        modalidad: ModalidadIntercambio.VENTA,
      };

      mockPublicationsRepository.findById.mockResolvedValue(publicacion);
      mockEntityManager.query.mockResolvedValue([]);

      const actualizacion = service.actualizar('pub-id', dto, 'owner-id');

      await expect(actualizacion).rejects.toThrow(BadRequestException);
      await expect(actualizacion).rejects.toThrow(
        'El precio es obligatorio para las ventas',
      );
      expect(mockPublicationsRepository.save).not.toHaveBeenCalled();
    });
  });
});
