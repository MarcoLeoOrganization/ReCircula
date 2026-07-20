import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PublicationsRepository,
  FindAllOptions,
} from './repositories/publications.repository';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { Publication } from './entities/publication.entity';
import { Componente } from './entities/component.entity';
import { ImagenPublicacion } from './entities/image.entity';
import { EstadoPublicacion, ModalidadIntercambio } from '../../common/types';
import { PublicationCreatedEvent } from '../../common/events';
import * as crypto from 'crypto';
import * as path from 'path';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Injectable()
export class PublicationsService {
  private readonly logger = new Logger(PublicationsService.name);

  constructor(
    private readonly repo: PublicationsRepository,
    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async crear(
    dto: CreatePublicationDto,
    publicadorId: string,
    imagenes: Express.Multer.File[],
  ): Promise<Publication> {
    // 1. Validaciones lógicas de negocio de la modalidad y precio (RF-02.1)
    if (
      (dto.modalidad === ModalidadIntercambio.VENTA ||
        dto.modalidad === ModalidadIntercambio.VENTA_PIEZAS) &&
      dto.precio === undefined
    ) {
      throw new BadRequestException('El precio es obligatorio para las ventas');
    }

    // 2. Validación de VENTA_PIEZAS y componentes obligatorios (RF-02.2 Criterio 4)
    if (dto.modalidad === ModalidadIntercambio.VENTA_PIEZAS) {
      if (!dto.componentes || dto.componentes.length === 0) {
        throw new BadRequestException(
          'El desglose de componentes es obligatorio en la modalidad Venta por piezas',
        );
      }
    }

    // 3. Procesar las imágenes (máximo 10) (RF-02.3)
    if (imagenes.length > 10) {
      throw new BadRequestException(
        'Se permite subir un máximo de 10 imágenes por publicación',
      );
    }

    const entidadImagenes: ImagenPublicacion[] = [];
    for (let i = 0; i < imagenes.length; i++) {
      const img = imagenes[i];

      // Validar formato de imagen (JPG, PNG, WebP)
      const mimePermitidos = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!mimePermitidos.includes(img.mimetype)) {
        throw new BadRequestException(
          `Formato de imagen inválido para ${img.originalname}. Solo se permite JPG, PNG y WebP.`,
        );
      }

      // Validar tamaño (máximo 5 MB)
      const maxSize = 5 * 1024 * 1024;
      if (img.size > maxSize) {
        throw new BadRequestException(
          `La imagen ${img.originalname} excede el límite permitido de 5 MB.`,
        );
      }

      // Subir a Supabase Storage
      const ext = path.extname(img.originalname).toLowerCase();
      const randomName = crypto.randomUUID() + ext;
      const publicUrl = await this.storageService.uploadFile(
        'publications',
        randomName,
        img.buffer,
        img.mimetype,
      );

      const dbImg = new ImagenPublicacion();
      dbImg.url = publicUrl;
      dbImg.esPrincipal = i === 0; // La primera es la principal (miniatura) (RF-02.3 Criterio 3)
      dbImg.orden = i;
      entidadImagenes.push(dbImg);
    }

    // 4. Crear los componentes
    const entidadComponentes: Componente[] = [];
    if (dto.componentes && dto.componentes.length > 0) {
      for (const compDto of dto.componentes) {
        const comp = new Componente();
        comp.nombre = compDto.nombre;
        comp.funcional = compDto.funcional;
        comp.descripcion = compDto.descripcion ?? null;
        comp.precioPieza =
          compDto.precioPieza !== undefined
            ? Number(compDto.precioPieza)
            : null;
        entidadComponentes.push(comp);
      }
    }

    // 5. Crear la publicación
    const publicacion = new Publication();
    publicacion.titulo = dto.titulo;
    publicacion.descripcion = dto.condition
      ? `[Condición: ${dto.condition}] ${dto.descripcion}`
      : dto.descripcion;
    publicacion.categoria = dto.categoria;
    publicacion.modalidad = dto.modalidad;
    // Si no es venta, se ignora el precio
    publicacion.precio =
      dto.modalidad === ModalidadIntercambio.VENTA ||
      dto.modalidad === ModalidadIntercambio.VENTA_PIEZAS
        ? Number(dto.precio)
        : null;
    publicacion.moneda = dto.moneda || 'MXN';
    publicacion.ubicacion = {
      latitud: Number(dto.ubicacion.latitud),
      longitud: Number(dto.ubicacion.longitud),
    };
    publicacion.direccionReferencia = dto.direccionReferencia ?? null;
    publicacion.publicadorId = publicadorId;
    publicacion.estado = EstadoPublicacion.PUBLICADO; // Pasa directo a PUBLICADO para el listado

    publicacion.imagenes = entidadImagenes;
    publicacion.componentes = entidadComponentes;

    const publicacionCreada = await this.repo.create(publicacion);

    // Emitir evento de publicación creada (EDA)
    this.eventEmitter.emit(
      'publication.created',
      new PublicationCreatedEvent(
        publicacionCreada.id,
        publicacionCreada.titulo,
        publicacionCreada.categoria,
      ),
    );

    return publicacionCreada;
  }

  async buscarTodas(filtros: FindAllOptions): Promise<Publication[]> {
    return this.repo.findAll(filtros);
  }

  async obtenerDetalle(id: string): Promise<Publication> {
    const pub = await this.repo.findById(id);
    if (!pub) {
      throw new NotFoundException(`Publicación con ID ${id} no encontrada`);
    }
    return pub;
  }

  async actualizar(
    id: string,
    dto: UpdatePublicationDto,
    publicadorId: string,
  ): Promise<Publication> {
    const pub = await this.obtenerDetalle(id);

    // Validar propietario
    if (pub.publicadorId !== publicadorId) {
      throw new BadRequestException(
        'No tienes permisos para editar esta publicación',
      );
    }

    // Validar que no tenga transacciones activas (RF-02.4 Criterio 3)
    await this.validarSinTransaccionesActivas(id, 'editar');

    // Actualizar campos permitidos
    if (dto.titulo) pub.titulo = dto.titulo;
    if (dto.descripcion) pub.descripcion = dto.descripcion;
    if (dto.categoria) pub.categoria = dto.categoria;
    if (dto.condition) {
      // Si la UI maneja "condición general del artículo" se puede mapear a descripción o un metadato
      pub.descripcion = `[Condición: ${dto.condition}] ${pub.descripcion}`;
    }

    if (dto.modalidad) {
      pub.modalidad = dto.modalidad;
      if (
        (dto.modalidad === ModalidadIntercambio.VENTA ||
          dto.modalidad === ModalidadIntercambio.VENTA_PIEZAS) &&
        dto.precio === undefined &&
        pub.precio === null
      ) {
        throw new BadRequestException(
          'El precio es obligatorio para las ventas',
        );
      }
    }

    if (dto.precio !== undefined) {
      pub.precio =
        pub.modalidad === ModalidadIntercambio.VENTA ||
        pub.modalidad === ModalidadIntercambio.VENTA_PIEZAS
          ? Number(dto.precio)
          : null;
    }

    if (dto.direccionReferencia)
      pub.direccionReferencia = dto.direccionReferencia;

    if (dto.ubicacion) {
      pub.ubicacion = {
        latitud: Number(dto.ubicacion.latitud),
        longitud: Number(dto.ubicacion.longitud),
      };
    }

    return this.repo.save(pub);
  }

  async archivar(id: string, publicadorId: string): Promise<Publication> {
    const pub = await this.obtenerDetalle(id);

    // Validar propietario
    if (pub.publicadorId !== publicadorId) {
      throw new BadRequestException(
        'No tienes permisos para archivar esta publicación',
      );
    }

    // Validar que no tenga transacciones activas (RF-02.4 Criterio 3)
    await this.validarSinTransaccionesActivas(id, 'archivar');

    pub.estado = EstadoPublicacion.ARCHIVADO;
    pub.fechaArchivado = new Date();

    return this.repo.save(pub);
  }

  private async validarSinTransaccionesActivas(
    id: string,
    accion: string,
  ): Promise<void> {
    const activeTx = await this.entityManager.query(
      `SELECT id FROM transacciones WHERE publicacion_id = $1 AND estado NOT IN ('COMPLETADA', 'CANCELADA') LIMIT 1`,
      [id],
    );

    if (activeTx && activeTx.length > 0) {
      throw new BadRequestException(
        `No se puede ${accion} la publicación porque tiene una transacción activa en curso`,
      );
    }
  }
}
