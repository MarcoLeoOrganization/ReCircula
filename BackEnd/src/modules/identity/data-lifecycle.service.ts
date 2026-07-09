import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Sesion } from './entities/sesion.entity';
import { TokenRecuperacion } from './entities/token-recuperacion.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class DataLifecycleService {
  private readonly logger = new Logger(DataLifecycleService.name);

  constructor(
    @InjectRepository(Sesion)
    private readonly sesionRepo: Repository<Sesion>,
    @InjectRepository(TokenRecuperacion)
    private readonly tokenRepo: Repository<TokenRecuperacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  /**
   * Se ejecuta CADA MINUTO (configurado para pruebas).
   * Elimina datos que ya cumplieron su finalidad para cumplir con
   * el principio de Minimización de Datos.
   */
  @Cron('* * * * *')
  async limpiarDatosExpirados() {
    this.logger.log('Iniciando limpieza de datos expirados...');

    const ahora = new Date();

    // 1. Eliminar sesiones expiradas o invalidadas
    const sesionesEliminadas = await this.sesionRepo.delete({
      fechaExpiracion: LessThan(ahora),
    });
    const sesionesInvalidas = await this.sesionRepo.delete({
      invalidado: true,
    });
    this.logger.log(
      `Sesiones eliminadas: ${sesionesEliminadas.affected ?? 0} expiradas, ${sesionesInvalidas.affected ?? 0} invalidadas.`,
    );

    // 2. Eliminar tokens de recuperación expirados
    const tokensEliminados = await this.tokenRepo.delete({
      fechaExpiracion: LessThan(ahora),
    });
    this.logger.log(
      `Tokens de recuperación expirados eliminados: ${tokensEliminados.affected ?? 0}.`,
    );

    // 3. Eliminar cuentas no verificadas (inactivas) que tengan más de 1 MINUTO de creadas (Para Pruebas)
    const limiteExpiracion = new Date();
    limiteExpiracion.setMinutes(ahora.getMinutes() - 1);

    const usuariosEliminados = await this.usuarioRepo.delete({
      emailVerificado: false,
      fechaRegistro: LessThan(limiteExpiracion),
    });
    this.logger.log(
      `Usuarios no verificados eliminados: ${usuariosEliminados.affected ?? 0}.`,
    );

    this.logger.log('Limpieza de datos expirados finalizada.');
  }
}
