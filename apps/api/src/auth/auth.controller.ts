import {
  Controller,
  Post,
  Body,
  Req,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email/Password ───────────────────────────────────────────

  // 20 tentativas por minuto — previne abuso em cadastro em massa
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('register')
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já em uso' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.register(registerDto, ip, userAgent);
  }

  // 10 tentativas por minuto — previne brute-force de senha
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login e obter token de acesso' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou e-mail não verificado',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verificar e-mail do usuário' })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso' })
  @ApiResponse({ status: 409, description: 'Token inválido ou expirado' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  // ─── Session Management ───────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.refreshTokens(refreshToken, ip, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerrar sessão e revogar refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // ─── OAuth ───────────────────────────────────────────────────

  // 5 tentativas por minuto — OAuth é vetor de token stuffing
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar ou registrar via Google Sign-In',
    description:
      'Recebe o idToken do Google OAuth 2.0, valida com a Google Auth Library e retorna JWT + refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Autenticado com sucesso via Google' })
  @ApiResponse({ status: 401, description: 'Token Google inválido' })
  @ApiResponse({
    status: 500,
    description: 'GOOGLE_CLIENT_ID não configurado no servidor',
  })
  async googleLogin(
    @Body() dto: GoogleAuthDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.loginWithGoogle(dto.idToken, ip, userAgent);
  }

  // 5 tentativas por minuto — mesmo nível que Google
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar ou registrar via Apple Sign-In',
    description:
      'Recebe o identityToken da Apple. fullName só é enviado no primeiro login — persiste imediatamente.',
  })
  @ApiResponse({ status: 200, description: 'Autenticado com sucesso via Apple' })
  @ApiResponse({ status: 401, description: 'Token Apple inválido' })
  @ApiResponse({
    status: 500,
    description: 'APPLE_CLIENT_ID não configurado no servidor',
  })
  async appleLogin(
    @Body() dto: AppleAuthDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.loginWithApple(
      dto.identityToken,
      dto.fullName,
      ip,
      userAgent,
    );
  }
}
