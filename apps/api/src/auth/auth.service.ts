import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, UserType } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UserService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  // ============================================================
  // PRIVATE: Token Generation (shared by all auth methods)
  // ============================================================

  private async generateTokens(user: any, ip: string, userAgent: string) {
    const payload = { sub: user.id, email: user.email, type: user.type };

    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

  // ============================================================
  //  findOrCreateOAuthUser — idempotent upsert for OAuth providers
  // ============================================================

  private async findOrCreateOAuthUser(params: {
    email: string;
    name: string;
    googleId?: string;
    appleId?: string;
  }) {
    const { email, name, googleId, appleId } = params;

    // 1. Try to find by provider ID first (most specific match)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(googleId ? [{ googleId }] : []),
          ...(appleId ? [{ appleId }] : []),
          { email },
        ],
      },
    });

    if (user) {
      // 2. If found, patch missing provider IDs (account linking)
      const updates: Record<string, string> = {};
      if (googleId && !user.googleId) updates.googleId = googleId;
      if (appleId && !user.appleId) updates.appleId = appleId;

      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
      return user;
    }

    // 3. Create brand-new OAuth user (no password, already verified)
    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: null,
        googleId: googleId ?? null,
        appleId: appleId ?? null,
        type: UserType.BUYER,
        status: UserStatus.ACTIVE, // OAuth = already verified by provider
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  // ============================================================
  // GOOGLE SIGN-IN
  // ============================================================

  async loginWithGoogle(idToken: string, ip: string, userAgent: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new InternalServerErrorException(
        'Google OAuth não está configurado. Adicione GOOGLE_CLIENT_ID ao .env.',
      );
    }

    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token Google inválido ou expirado.');
    }

    const { sub: googleId, email, name } = payload;

    if (!email) {
      throw new UnauthorizedException(
        'Não foi possível obter o e-mail da conta Google.',
      );
    }

    const user = await this.findOrCreateOAuthUser({
      email,
      name: name ?? email.split('@')[0],
      googleId,
    });

    return this.generateTokens(user, ip, userAgent);
  }

  // ============================================================
  // APPLE SIGN-IN
  // ============================================================

  async loginWithApple(
    identityToken: string,
    fullName: string | undefined,
    ip: string,
    userAgent: string,
  ) {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

    if (!clientId) {
      throw new InternalServerErrorException(
        'Apple Sign-In não está configurado. Adicione APPLE_CLIENT_ID ao .env.',
      );
    }

    let applePayload: any;
    try {
      applePayload = await appleSignin.verifyIdToken(identityToken, {
        audience: clientId,
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException('Token Apple inválido ou expirado.');
    }

    const { sub: appleId, email } = applePayload;

    if (!email && !appleId) {
      throw new UnauthorizedException(
        'Não foi possível identificar o usuário Apple.',
      );
    }

    // Apple may relay a private email — we store it as is
    const resolvedEmail =
      email ?? `${appleId}@privaterelay.appleid.com`;

    const user = await this.findOrCreateOAuthUser({
      email: resolvedEmail,
      // Apple only sends fullName on first sign-in — fallback to email prefix
      name: fullName?.trim() || resolvedEmail.split('@')[0],
      appleId,
    });

    return this.generateTokens(user, ip, userAgent);
  }

  // ============================================================
  // EMAIL/PASSWORD AUTH
  // ============================================================

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

  async register(registerDto: RegisterDto, ip: string, userAgent: string) {
    const { email, password, name, type } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('O e-mail informado já está em uso.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const { user, verificationToken } = await this.prisma.$transaction(
        async (tx) => {
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
              version: '1.0.0',
              ip,
              userAgent,
            },
          });

          const rawToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');

          await tx.emailVerificationToken.create({
            data: {
              userId: newUser.id,
              tokenHash,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          return { user: newUser, verificationToken: rawToken };
        },
      );

      this.mailService
        .sendVerificationEmail(user.email, user.name, verificationToken)
        .catch((err) => console.error('Delayed Error sending email:', err));

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

    const verificationToken = await this.prisma.emailVerificationToken.findFirst(
      {
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      },
    );

    if (!verificationToken) {
      throw new ConflictException(
        'Token de verificação inválido, já utilizado ou expirado.',
      );
    }

    try {
      await this.prisma.$transaction([
        this.prisma.emailVerificationToken.update({
          where: { id: verificationToken.id },
          data: { usedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: verificationToken.userId },
          data: { status: UserStatus.ACTIVE },
        }),
      ]);

      return { message: 'E-mail verificado com sucesso! Sua conta está ativa.' };
    } catch {
      throw new InternalServerErrorException(
        'Erro ao verificar e-mail. Tente novamente mais tarde.',
      );
    }
  }

  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

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

    await this.prisma.refreshToken.update({
      where: { id: savedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(savedToken.user, ip, userAgent);
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Sessão encerrada com sucesso.' };
  }
}
