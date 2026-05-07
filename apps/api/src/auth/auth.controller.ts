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
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email/Password ───────────────────────────────────────────

  // 20 tentativas por minuto — previne abuso em cadastro em massa
  @Public()
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
  @Public()
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

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verificar e-mail do usuário' })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso' })
  @ApiResponse({ status: 409, description: 'Token inválido ou expirado' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.code);
  }

  // ─── Session Management ───────────────────────────────────────

  @Public()
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

  // ─── OAuth ───────────────────────────────────────────────────

  // 5 tentativas por minuto — OAuth é vetor de token stuffing
  @Public()
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

  // ─── Phone OTP ───────────────────────────────────────────────

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 envios por minuto
  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar código OTP via SMS para o telefone' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 tentativas por minuto
  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar código OTP e realizar login' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.verifyOtp(dto.phone, dto.code, ip, userAgent);
  }

  // ─── Password Recovery ───────────────────────────────────────

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar link de recuperação de senha' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha usando token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
