import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UserType, UserStatus } from "@prisma/client";
import { UserService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { OAuth2Client } from "google-auth-library";
import { SmsService } from "../common/sms/sms.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UserService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>("GOOGLE_CLIENT_ID"),
    );
  }

  // ============================================================
  // PRIVATE: Token Generation (shared by all auth methods)
  // ============================================================

  private async generateTokens(
    user: { id: string; email: string; name: string; type: UserType },
    ip: string,
    userAgent: string,
  ) {
    let hasProfile = false;
    if (user.type === UserType.SELLER || user.type === UserType.BOTH) {
      const profile = await this.prisma.sellerProfile.findUnique({
        where: { userId: user.id },
      });
      hasProfile = !!profile;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      type: user.type,
      hasProfile,
    };

    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

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
        hasProfile,
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
  }) {
    const { email, name, googleId } = params;

    // 1. Try to find by provider ID first (most specific match)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [...(googleId ? [{ googleId }] : []), { email }],
      },
    });

    if (user) {
      // 2. If found, patch missing provider IDs (account linking)
      if (googleId && !user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
      return user;
    }

    // 3. Create brand-new OAuth user (no password, already verified)
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          googleId: googleId ?? null,
          type: UserType.BUYER,
          status: UserStatus.ACTIVE, // OAuth = already verified by provider
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.buyerProfile.create({
        data: {
          userId: newUser.id,
          name: newUser.name,
        },
      });

      await tx.notificationPreferences.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });
  }

  // ============================================================
  // GOOGLE SIGN-IN
  // ============================================================

  async loginWithGoogle(idToken: string, ip: string, userAgent: string) {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");

    if (!clientId) {
      throw new InternalServerErrorException(
        "Google OAuth não está configurado. Adicione GOOGLE_CLIENT_ID ao .env.",
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
      throw new UnauthorizedException("Token Google inválido ou expirado.");
    }

    const { sub: googleId, email, name } = payload;

    if (!email) {
      throw new UnauthorizedException(
        "Não foi possível obter o e-mail da conta Google.",
      );
    }

    const user = await this.findOrCreateOAuthUser({
      email,
      name: name ?? email.split("@")[0],
      googleId,
    });

    return this.generateTokens(user, ip, userAgent);
  }

  // ============================================================
  // PHONE OTP AUTH
  // ============================================================

  async sendOtp(phone: string) {
    // 1. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    // 2. Definir expiração (5 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 3. Salvar no banco
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        expiresAt,
      },
    });

    // 4. Enviar via SMS
    await this.smsService.sendSms(
      phone,
      `Seu código de acesso PECAÊ é: ${code}`,
    );

    return {
      message:
        "Se este telefone estiver cadastrado, você receberá um código em instantes.",
    };
  }

  async verifyOtp(phone: string, code: string, ip: string, userAgent: string) {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    // 1. Buscar OTP válido
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new UnauthorizedException("Código inválido ou expirado.");
    }

    // 2. Marcar como usado
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // 3. Buscar usuário pelo telefone
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException(
        "Telefone não vinculado a nenhuma conta ativa.",
      );
    }

    // 4. Atualizar flag de verificação se necessário
    if (!user.phoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, phoneVerifiedAt: new Date() },
      });
    }

    return this.generateTokens(user, ip, userAgent);
  }

  // ============================================================
  // PASSWORD RECOVERY
  // ============================================================

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Segurança: Não revelar se o usuário existe
    if (!user) {
      return {
        message:
          "Se o e-mail informado estiver em nossa base, você receberá instruções para redefinir sua senha.",
      };
    }

    // 1. Gerar token de recuperação
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 2. Salvar token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 3. Enviar e-mail
    await this.mailService
      .sendPasswordResetEmail(user.email, user.name, token)
      .catch((err) => this.logger.error("Error sending reset email:", err));

    return {
      message: "Instruções de recuperação enviadas para o e-mail informado.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. Validar token
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new UnauthorizedException(
        "Token de recuperação inválido ou expirado.",
      );
    }

    // 2. Atualizar senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Senha redefinida com sucesso. Faça login novamente." };
  }

  // ============================================================
  // EMAIL/PASSWORD AUTH
  // ============================================================

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      this.logger.warn(
        `Login failed: User not found for email ${normalizedEmail}`,
      );
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash || "",
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed: Invalid password for user ${normalizedEmail}`,
      );
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        "Sua conta ainda não foi ativada. Verifique seu e-mail.",
      );
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException("Esta conta foi suspensa.");
    }

    return this.generateTokens(user, ip, userAgent);
  }

  private async createBuyerProfileIfNotExists(
    tx: any,
    userId: string,
    userName: string,
    type: UserType,
  ) {
    if (type === UserType.BUYER || type === UserType.BOTH) {
      await tx.buyerProfile.create({
        data: {
          userId,
          name: userName,
        },
      });
      await tx.notificationPreferences.create({
        data: {
          userId,
        },
      });
    }
  }

  private async createEmailVerificationToken(tx: any, userId: string) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await tx.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return rawToken;
  }

  async register(registerDto: RegisterDto, ip: string, userAgent: string) {
    const { email, password, name, type } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("O e-mail informado já está em uso.");
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
              version: "1.0.0",
              ip,
              userAgent,
            },
          });

          if (type === UserType.BUYER || type === UserType.BOTH) {
            await tx.buyerProfile.create({
              data: {
                userId: newUser.id,
                name: newUser.name,
              },
            });
            await tx.notificationPreferences.create({
              data: {
                userId: newUser.id,
              },
            });
          }

          const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
          const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

          await tx.emailVerificationToken.create({
            data: {
              userId: newUser.id,
              tokenHash,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos de validade
            },
          });

          return { user: newUser, verificationToken: rawToken };
        },
      );

      this.mailService
        .sendVerificationEmail(user.email, user.name, verificationToken)
        .catch((err) => this.logger.error("Delayed Error sending email:", err));

      return {
        message:
          "Cadastro realizado com sucesso. Verifique seu e-mail para ativar sua conta.",
      };
    } catch (error) {
      this.logger.error("Registration Error:", error);
      throw new InternalServerErrorException(
        "Erro ao processar o cadastro. Tente novamente mais tarde.",
      );
    }
  }

  async verifyEmail(code: string) {
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");

    const verificationToken =
      await this.prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

    if (!verificationToken) {
      throw new ConflictException(
        "Token de verificação inválido, já utilizado ou expirado.",
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
          data: {
            status: UserStatus.ACTIVE,
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        }),
      ]);

      return {
        message: "E-mail verificado com sucesso! Sua conta está ativa.",
      };
    } catch {
      throw new InternalServerErrorException(
        "Erro ao verificar e-mail. Tente novamente mais tarde.",
      );
    }
  }

  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const savedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!savedToken) {
      throw new UnauthorizedException("Sessão inválida ou expirada.");
    }

    await this.prisma.refreshToken.update({
      where: { id: savedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(savedToken.user, ip, userAgent);
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: "Sessão encerrada com sucesso." };
  }
}
