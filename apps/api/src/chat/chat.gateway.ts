import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      
      this.logger.log(`Client ${client.id} connected (User: ${payload.sub})`);
    } catch (e) {
      this.logger.error(`Client ${client.id} connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
  ) {
    const userId = client.data.user.sub;
    
    try {
      // Verifica se o usuário pertence à sala
      await this.chatService.findRoomById(roomId, userId);
      
      client.join(roomId);
      this.logger.log(`User ${userId} joined room ${roomId}`);
      
      return { event: 'joined', data: roomId };
    } catch (e) {
      return { event: 'error', data: e.message };
    }
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe())
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    const userId = client.data.user.sub;
    
    try {
      const message = await this.chatService.sendMessage(
        data.roomId,
        userId,
        data.content,
      );

      // Emite para todos na sala, incluindo o remetente (ou o remetente pode tratar localmente)
      this.server.to(data.roomId).emit('newMessage', message);
      
      return { event: 'sent', data: message };
    } catch (e) {
      return { event: 'error', data: e.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
    @MessageBody('isTyping') isTyping: boolean,
  ) {
    const userId = client.data.user.sub;
    client.to(roomId).emit('userTyping', { userId, isTyping });
  }
}
