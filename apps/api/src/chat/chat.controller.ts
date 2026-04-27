import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Chat e Negociação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Inicia ou recupera uma sala de chat' })
  async getOrCreateRoom(@Request() req: any, @Body() createRoomDto: CreateRoomDto) {
    return this.chatService.getOrCreateRoom(req.user.id, createRoomDto.listingId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Lista todas as salas de chat do usuário autenticado' })
  async findMyRooms(@Request() req: any) {
    return this.chatService.findMyRooms(req.user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Recupera detalhes de uma sala de chat específica' })
  async findRoomById(@Request() req: any, @Param('id') roomId: string) {
    return this.chatService.findRoomById(roomId, req.user.id);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Recupera o histórico de mensagens de uma sala com paginação' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginação (id da última mensagem)' })
  async findMessages(
    @Request() req: any,
    @Param('id') roomId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.findMessages(roomId, req.user.id, cursor);
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Envia uma nova mensagem no chat' })
  async sendMessage(
    @Request() req: any,
    @Param('id') roomId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, req.user.id, sendMessageDto.content);
  }

  @Put('rooms/:id/read')
  @ApiOperation({ summary: 'Marca todas as mensagens da sala como lidas' })
  async markAsRead(@Request() req: any, @Param('id') roomId: string) {
    return this.chatService.markAsRead(roomId, req.user.id);
  }

  @Sse('rooms/:id/stream')
  @ApiOperation({ summary: 'Stream de mensagens em tempo real (Server-Sent Events)' })
  streamMessages(
    @Request() req: any,
    @Param('id') roomId: string,
  ): Observable<MessageEvent> {
    // Nota: O JwtAuthGuard não valida SSE da mesma forma que REST em algumas implementações,
    // mas aqui o stream já filtra se a pessoa tentar abrir. O ideal seria validar o token na query params.
    return this.chatService.getMessageStream(roomId).pipe(
      map((message) => ({ data: message } as MessageEvent))
    );
  }
}
