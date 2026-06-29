export enum RolUsuario {
  USUARIO_GENERAL   = 'USUARIO_GENERAL',
  REPARADOR_VERIFICADO = 'REPARADOR_VERIFICADO',
  ADMINISTRADOR        = 'ADMINISTRADOR',
}

export enum EstadoPublicacion {
  BORRADOR = 'BORRADOR',
  PUBLICADO = 'PUBLICADO',
  RESERVADO = 'RESERVADO',
  INTERCAMBIADO = 'INTERCAMBIADO',
  ARCHIVADO = 'ARCHIVADO',
}

export enum ModalidadIntercambio {
  DONACION = 'DONACION',
  VENTA = 'VENTA',
  TRUEQUE = 'TRUEQUE',
  VENTA_PIEZAS = 'VENTA_PIEZAS',
}

export enum EstadoTransaccion {
  PENDIENTE  = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA  = 'CANCELADA',
}

export enum EstadoVerificacion {
  PENDIENTE  = 'PENDIENTE',
  APROBADA   = 'APROBADA',
  RECHAZADA  = 'RECHAZADA',
}

export enum TipoEntradaHistorial {
  INTERCAMBIO = 'INTERCAMBIO',
  REPARACION = 'REPARACION',
  CAMBIO_PROPIETARIO = 'CAMBIO_PROPIETARIO',
  INSPECCION = 'INSPECCION',
}

export interface GeolocationPoint {
  latitud: number;
  longitud: number;
}

export interface Publication {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: ModalidadIntercambio;
  estado: EstadoPublicacion;
  precio?: number;
  moneda: string;
  ubicacion: GeolocationPoint;
  direccionReferencia?: string;
  publicadorId: string;
  fechaCreacion: string | Date;
  fechaActualizacion: string | Date;
  fechaArchivado?: string | Date;
}

export interface Component {
  id: string;
  publicacionId: string;
  nombre: string;
  funcional: boolean;
  descripcion?: string;
  precioPieza?: number;
  fechaCreacion: string | Date;
}

export interface PublicationImage {
  id: string;
  publicacionId: string;
  url: string;
  esPrincipal: boolean;
  orden: number;
  fechaSubida: string | Date;
}

export interface Transaction {
  id: string;
  publicacionId: string;
  iniciadorId: string;
  receptorId: string;
  modalidad: ModalidadIntercambio;
  estado: EstadoTransaccion;
  precioAcordado?: number;
  confirmacionIniciador: boolean;
  confirmacionReceptor: boolean;
  notas?: string;
  fechaCreacion: string | Date;
  fechaActualizacion: string | Date;
  fechaCompletada?: string | Date;
}

export interface TransactionAudit {
  id: string;
  transaccionId: string;
  estadoAnterior?: EstadoTransaccion;
  estadoNuevo: EstadoTransaccion;
  usuarioResponsableId: string;
  notas?: string;
  fechaCambio: string | Date;
}
export enum TipoNotificacion {
  INTERES_EN_PUBLICACION      = 'INTERES_EN_PUBLICACION',
  CAMBIO_ESTADO_TRANSACCION   = 'CAMBIO_ESTADO_TRANSACCION',
  NUEVA_PUBLICACION_FAVORITA  = 'NUEVA_PUBLICACION_FAVORITA',
  CALIFICACION_RECIBIDA       = 'CALIFICACION_RECIBIDA',
  SOLICITUD_VERIFICACION      = 'SOLICITUD_VERIFICACION',
  VERIFICACION_APROBADA       = 'VERIFICACION_APROBADA',
}
