import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Retorna o usuário decodificado se autenticado com sucesso,
    // caso contrário retorna null silenciosamente sem lançar UnauthorizedException.
    return user || null;
  }
}
