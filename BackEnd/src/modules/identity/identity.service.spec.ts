/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { UsuarioRepository } from './repositories/usuario.repository';
import { SesionRepository } from './repositories/sesion.repository';
import { TokenRecuperacionRepository } from './repositories/token-recuperacion.repository';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from './entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('IdentityService', () => {
  let service: IdentityService;
  let usuariosRepo: UsuarioRepository;
  let sesionesRepo: SesionRepository;
  let tokensRepo: TokenRecuperacionRepository;
  let mailService: MailService;
  let jwtService: JwtService;

  const mockUsuarioRepository = {
    findByEmail: jest.fn(),
    findByEmailConHash: jest.fn(),
    crear: jest.fn(),
    crearPerfilReparadorVacio: jest.fn(),
    actualizarPorId: jest.fn(),
  };

  const mockSesionRepository = {
    crear: jest.fn(),
    findByTokenHash: jest.fn(),
    invalidar: jest.fn(),
    invalidarTodasDeUsuario: jest.fn(),
    esSesionValida: jest.fn(),
  };

  const mockTokenRecuperacionRepository = {
    crear: jest.fn(),
    findValidoPorHash: jest.fn(),
    marcarUsado: jest.fn(),
    invalidarPreviosDeUsuario: jest.fn(),
  };

  const mockMailService = {
    enviarVerificacion: jest.fn(),
    enviarRecuperacion: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'mail.verifyExpiresMin') return 1440;
      return defaultValue ?? '1d';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: UsuarioRepository,
          useValue: mockUsuarioRepository,
        },
        {
          provide: SesionRepository,
          useValue: mockSesionRepository,
        },
        {
          provide: TokenRecuperacionRepository,
          useValue: mockTokenRecuperacionRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    usuariosRepo = module.get<UsuarioRepository>(UsuarioRepository);
    sesionesRepo = module.get<SesionRepository>(SesionRepository);
    tokensRepo = module.get<TokenRecuperacionRepository>(
      TokenRecuperacionRepository,
    );
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    it('debe lanzar ConflictException si el email ya está registrado', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue({ id: 'user-id' });
      const dto: RegisterDto = {
        nombre: 'Juan',
        email: 'duplicate@recircula.mx',
        password: 'Password123',
        rol: RolUsuario.USUARIO_GENERAL,
        aceptaTransferenciasTerceros: false,
      };

      await expect(service.registrar(dto)).rejects.toThrow(ConflictException);
      expect(mockUsuarioRepository.crear).not.toHaveBeenCalled();
      expect(mockMailService.enviarVerificacion).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('debe registrar el usuario, crear perfil de reparador si aplica, y enviar correo', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockUser = {
        id: 'new-user-id',
        nombre: 'Pedro Taller',
        email: 'reparador@recircula.mx',
        rol: RolUsuario.REPARADOR_VERIFICADO,
      };
      mockUsuarioRepository.crear.mockResolvedValue(mockUser);
      mockTokenRecuperacionRepository.crear.mockResolvedValue({});

      const dto: RegisterDto = {
        nombre: 'Pedro Taller',
        email: 'reparador@recircula.mx',
        password: 'Password123',
        rol: RolUsuario.REPARADOR_VERIFICADO,
        aceptaTransferenciasTerceros: true,
      };

      const res = await service.registrar(dto);

      expect(usuariosRepo.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: dto.nombre,
          email: dto.email,
          passwordHash: 'hashed-password',
          rol: dto.rol,
        }),
      );
      expect(usuariosRepo.crearPerfilReparadorVacio).toHaveBeenCalledWith(
        'new-user-id',
      );
      expect(mailService.enviarVerificacion).toHaveBeenCalled();
      expect(res.usuarioId).toBe('new-user-id');
    });
  });

  describe('verificarEmail', () => {
    it('debe lanzar BadRequestException si el token es inválido', async () => {
      mockTokenRecuperacionRepository.findValidoPorHash.mockResolvedValue(null);

      await expect(service.verificarEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe activar al usuario y marcar el token como usado', async () => {
      const mockTokenRecord = {
        id: 'token-record-id',
        usuarioId: 'user-id',
        fechaExpiracion: new Date(Date.now() + 1000 * 60 * 60), // en el futuro
        usuario: { email: 'user@recircula.mx' },
      };
      mockTokenRecuperacionRepository.findValidoPorHash.mockResolvedValue(
        mockTokenRecord,
      );

      await service.verificarEmail('valid-token');

      expect(usuariosRepo.actualizarPorId).toHaveBeenCalledWith('user-id', {
        emailVerificado: true,
        activo: true,
      });
      expect(tokensRepo.marcarUsado).toHaveBeenCalledWith('token-record-id');
    });
  });

  describe('login', () => {
    it('debe lanzar UnauthorizedException si las credenciales son inválidas', async () => {
      mockUsuarioRepository.findByEmailConHash.mockResolvedValue(null);
      const dto: LoginDto = {
        email: 'wrong@recircula.mx',
        password: 'Password123',
      };

      await expect(service.login(dto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si la cuenta no está verificada', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'unverified@recircula.mx',
        passwordHash: 'hashed',
        emailVerificado: false,
      };
      mockUsuarioRepository.findByEmailConHash.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto: LoginDto = {
        email: 'unverified@recircula.mx',
        password: 'Password123',
      };

      await expect(service.login(dto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe firmar el token JWT y crear registro de sesión si es válido', async () => {
      const mockUser = {
        id: 'user-id',
        nombre: 'Juan',
        email: 'valid@recircula.mx',
        passwordHash: 'hashed',
        rol: RolUsuario.USUARIO_GENERAL,
        emailVerificado: true,
        activo: true,
      };
      mockUsuarioRepository.findByEmailConHash.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token-string');

      const dto: LoginDto = {
        email: 'valid@recircula.mx',
        password: 'Password123',
      };

      const res = await service.login(dto, '127.0.0.1');

      expect(jwtService.sign).toHaveBeenCalled();
      expect(sesionesRepo.crear).toHaveBeenCalled();
      expect(res.usuario.email).toBe('valid@recircula.mx');
      expect(res.token).toBe('jwt-token-string');
    });
  });

  describe('reenviarVerificacion', () => {
    it('debe retornar mensaje genérico si el usuario no existe', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue(null);
      const res = await service.reenviarVerificacion(
        'nonexistent@recircula.mx',
      );
      expect(res.mensaje).toContain('Si el correo existe');
    });

    it('debe retornar mensaje genérico si el usuario ya está verificado', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue({
        emailVerificado: true,
      });
      const res = await service.reenviarVerificacion('verified@recircula.mx');
      expect(res.mensaje).toContain('Si el correo existe');
    });

    it('debe enviar verificación si no está verificado', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'unverified@recircula.mx',
        nombre: 'Pedro',
        emailVerificado: false,
      });
      mockTokenRecuperacionRepository.crear.mockResolvedValue({});

      const res = await service.reenviarVerificacion('unverified@recircula.mx');
      expect(res.mensaje).toContain('Si el correo existe');
      expect(mailService.enviarVerificacion).toHaveBeenCalled();
    });
  });

  describe('solicitarRecuperacion', () => {
    it('debe retornar mensaje genérico si el usuario no existe', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue(null);
      const res = await service.solicitarRecuperacion({
        email: 'wrong@recircula.mx',
      });
      expect(res.mensaje).toContain('recibirás un enlace');
    });

    it('debe enviar recuperación si el usuario existe y está activo', async () => {
      mockUsuarioRepository.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'active@recircula.mx',
        nombre: 'Pedro',
        activo: true,
      });
      mockTokenRecuperacionRepository.crear.mockResolvedValue({});

      const res = await service.solicitarRecuperacion({
        email: 'active@recircula.mx',
      });
      expect(res.mensaje).toContain('recibirás un enlace');
      expect(mailService.enviarRecuperacion).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debe invalidar sesión si existe y está activa', async () => {
      const mockSesion = { id: 'sesion-id', invalidado: false };
      mockSesionRepository.findByTokenHash.mockResolvedValue(mockSesion);
      mockSesionRepository.invalidar.mockResolvedValue(undefined);

      const res = await service.logout('some-token');
      expect(res.mensaje).toContain('Sesión cerrada');
      expect(mockSesionRepository.invalidar).toHaveBeenCalledWith('sesion-id');
    });
  });

  describe('esSesionValida', () => {
    it('debe delegar en el repositorio de sesiones', async () => {
      mockSesionRepository.esSesionValida.mockResolvedValue(true);
      const res = await service.esSesionValida('some-hash');
      expect(res).toBe(true);
      expect(mockSesionRepository.esSesionValida).toHaveBeenCalledWith(
        'some-hash',
      );
    });
  });
});
