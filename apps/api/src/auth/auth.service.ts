import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Sua conta ainda não foi ativada. Verifique seu e-mail.',
      );
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Esta conta foi suspensa.');
    }

    return this.generateTokens(user, ip, userAgent);
  }

  private async generateTokens(user: any, ip: string, userAgent: string) {
    const payload = { sub: user.id, email: user.email, type: user.type };
    
    const accessToken = this.jwtService.sign(payload);
    
    // Generate Refresh Token
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    
    // Save to DB
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  async register(registerDto: RegisterDto, ip: string, userAgent: string) {
    const { email, password, name, type } = registerDto;

    // 1. Check if email already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('O e-mail informado já está em uso.');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      // 3. Create user and register terms acceptance in a transaction
      const { user, verificationToken } = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            type,
            status: UserStatus.PENDING_VERIFICATION,
          },
        });

        await tx.termsAcceptance.create({
          data: {
            userId: newUser.id,
            version: '1.0.0', // TODO: Get from config/env
            ip,
            userAgent,
          },
        });

        // Generate Verification Token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await tx.emailVerificationToken.create({
          data: {
            userId: newUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        return { user: newUser, verificationToken: rawToken };
      });

      // 4. Dispatch verification email (fire and forget for better response time)
      this.mailService.sendVerificationEmail(user.email, user.name, verificationToken)
        .catch(err => console.error('Delayed Error sending email:', err));

      return {
        message:
          'Cadastro realizado com sucesso. Verifique seu e-mail para ativar sua conta.',
      };
    } catch (error) {
      console.error('Registration Error:', error);
      throw new InternalServerErrorException(
        'Erro ao processar o cadastro. Tente novamente mais tarde.',
      );
    }
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new ConflictException(
        'Token de verificação inválido, já utilizado ou expirado.',
      );
    }

    try {
      await this.prisma.$transaction([
        // 1. Mark token as used
        this.prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() },
        }),
        // 2. Activate user
        this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { status: UserStatus.ACTIVE },
        }),
      ]);

      return { message: 'E-mail verificado com sucesso! Sua conta está ativa.' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao verificar e-mail. Tente novamente mais tarde.',
  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const savedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!savedToken) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    // Revoke current token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: savedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new pair
    return this.generateTokens(savedToken.user, ip, userAgent);
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Sessão encerrada com sucesso.' };
  }
}
