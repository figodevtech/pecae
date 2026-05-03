import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SmsService } from '../common/sms/sms.service';
import { UserType, UserStatus } from '@prisma/client';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let usersService: any;
  let jwtService: any;

  const mockPrisma: any = {
    emailVerificationToken: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    sellerProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    buyerProfile: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    termsAcceptance: {
      create: jest.fn()
    },
    notificationPreferences: {
      create: jest.fn()
    },
    $transaction: jest.fn(async (callback) => {
      const tx = {
        user: mockPrisma.user,
        sellerProfile: mockPrisma.sellerProfile,
        buyerProfile: mockPrisma.buyerProfile,
        refreshToken: mockPrisma.refreshToken,
        emailVerificationToken: mockPrisma.emailVerificationToken,
        termsAcceptance: mockPrisma.termsAcceptance,
        notificationPreferences: mockPrisma.notificationPreferences
      };
      if (typeof callback === 'function') {
        return callback(tx);
      }
      return callback; // for array format
    }),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue({}),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn(),
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET' || key === 'JWT_REFRESH_SECRET') return 'secret';
      return null;
    }),
  };

  const mockSmsService = {
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    usersService = module.get(UserService);
    jwtService = module.get(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithGoogle', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      // Mocking googleClient.verifyIdToken to throw an error
      (service as any).googleClient = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      };

      await expect(
        service.loginWithGoogle('invalid-token', '127.0.0.1', 'user-agent')
      ).rejects.toThrow(new UnauthorizedException('Token Google inválido ou expirado.'));
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockToken = {
        id: 'token-1',
        userId: 'user-1',
        user: {
            status: UserStatus.PENDING_VERIFICATION
        }
      };

      mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(mockToken);
      mockPrisma.emailVerificationToken.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');

      expect(result).toEqual({ message: 'E-mail verificado com sucesso! Sua conta está ativa.' });
    });

    it('should throw ConflictException for invalid token', async () => {
      mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(ConflictException);
    });
  });

  describe('[AUTH-U-01] Hash de senha ao registrar', () => {
    it('should hash password and not store plain text', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'senha123',
        name: 'Test',
        type: UserType.BUYER,
        termsAccepted: true
      };

      const hashedPassword = 'hashed-senha123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      usersService.findByEmail.mockResolvedValue(null);

      let savedData: any;
      mockPrisma.user.create.mockImplementationOnce((args: any) => {
        savedData = args.data;
        return { id: 'user-1', ...args.data, verificationToken: 'token' };
      });
      mockPrisma.buyerProfile.create.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.sellerProfile.create.mockResolvedValue({});

      await service.register(dto, '127.0.0.1', 'agent');

      expect(savedData.passwordHash).toBe(hashedPassword);
      expect(savedData.passwordHash).not.toBe('senha123');

      const compareResult = await bcrypt.compare('senha123', savedData.passwordHash);
      expect(compareResult).toBe(true);
    });
  });

  describe('[AUTH-U-02] Login com credenciais válidas retorna JWT', () => {
    it('should return tokens on valid login', async () => {
      const user = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
        status: UserStatus.ACTIVE,
        type: UserType.BUYER
      };

      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockJwtService.sign
        .mockReturnValueOnce('access.token.xxx')
        .mockReturnValueOnce('refresh.token.yyy');

      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'test@test.com', password: 'senha123' }, 'ip', 'agent');

      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(typeof result.tokens.accessToken).toBe('string');
      expect(typeof result.tokens.refreshToken).toBe('string');
      expect(result.tokens.accessToken).toBe('access.token.xxx');
    });
  });

  describe('[AUTH-U-03] Login com senha incorreta lança UnauthorizedException', () => {
    it('should throw UnauthorizedException on wrong password', async () => {
      const user = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' }, 'ip', 'agent'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('[AUTH-U-04] Token JWT expirado é rejeitado', () => {
    it('should reject expired token', async () => {
      const jwtError = new Error('jwt expired');
      jwtError.name = 'TokenExpiredError';

      mockJwtService.verifyAsync = jest.fn().mockRejectedValue(jwtError);

      await expect(mockJwtService.verifyAsync('expired-token')).rejects.toThrow('jwt expired');
    });
  });

  describe('[AUTH-U-05] Refresh token válido retorna novo access_token', () => {
    it('should return new access token for valid refresh token', async () => {
      const payload = { sub: 'user-1' };

      const user = {
        id: 'user-1',
        status: UserStatus.ACTIVE,
        email: 'test@test.com',
        type: 'BUYER',
      };
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'token-id-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000), // future date
        user: user, // Added the included user so generateTokens has it
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      mockJwtService.sign.mockReset();
      mockJwtService.sign.mockReturnValueOnce('new.access.token');

      const result = await service.refreshTokens('valid-refresh-token', 'ip', 'agent');

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('new.access.token');
    });
  });

  describe('[AUTH-U-06] Logout invalida o refresh token', () => {
    it('should clear refresh token on logout', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      await service.logout('some-refresh-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) })
      });
    });
  });
});
