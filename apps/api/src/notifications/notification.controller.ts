import { Controller, Get, Put, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as notificações do usuário autenticado com paginação' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async getUserNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.notificationService.getUserNotifications(req.user.sub, parsedLimit, cursor);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Retorna a contagem de notificações não lidas' })
  async getUnreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user.sub);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Marca todas as notificações do usuário como lidas' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marca uma notificação específica como lida' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.sub, id);
  }
}
