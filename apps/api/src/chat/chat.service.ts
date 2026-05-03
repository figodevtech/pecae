import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable()
export class ChatService {
  // Mapa para gerenciar streams de mensagens em tempo real por sala
  private messageStreams = new Map<string, Subject<any>>();

  constructor(private readonly prisma: PrismaService) {}

  private getOrCreateStream(roomId: string): Subject<any> {
    if (!this.messageStreams.has(roomId)) {
      this.messageStreams.set(roomId, new Subject<any>());
    }
    return this.messageStreams.get(roomId)!;
  }

  getMessageStream(roomId: string): Observable<any> {
    return this.getOrCreateStream(roomId).asObservable();
  }

  private getRoomMetadata(room: any) {
    let title = 'Conversa';
    let thumbnail = null;

    if (room.vehicle) {
      title = `${room.vehicle.version.model.brand.name} ${room.vehicle.version.model.name}`;
      thumbnail = room.vehicle.photos[0]?.url || null;
    } else if (room.listing) {
      title = room.listing.title;
      thumbnail = room.listing.vehicle?.photos[0]?.url || null;
    }

    return { title, thumbnail };
  }

  /**
   * Maps a room entity to the response format.
   * Extracted from findMyRooms to improve readability and testability.
   */
  private async mapRoomToResponse(room: any, userId: string, precalculatedUnreadCount?: number) {
    const { title, thumbnail } = this.getRoomMetadata(room);

    const lastRead = room.reads?.[0]?.lastReadAt || new Date(0);
    let unreadCount = precalculatedUnreadCount;

    if (unreadCount === undefined) {
      unreadCount = await this.prisma.chatMessage.count({
      where: {
        roomId: room.id,
        createdAt: { gt: lastRead },
        senderId: { not: userId },
      },
    });
    }

    const lastMessage = room.messages?.[0] || null;

    return {
      id: room.id,
      listingId: room.listingId,
      vehicleId: room.vehicleId,
      listingTitle: title,
      listingThumbnail: thumbnail,
      interlocutor: userId === room.buyerId ? room.seller : room.buyer,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount,
      updatedAt: room.updatedAt,
    };
  }

  async getOrCreateRoom(buyerId: string, data: { listingId?: string, vehicleId?: string }) {
    const { listingId, vehicleId } = data;

    if (!listingId && !vehicleId) {
      throw new NotFoundException('É necessário informar listingId ou vehicleId.');
    }

    let sellerId: string;
    let targetListingId: string | null = listingId || null;
    let targetVehicleId: string | null = vehicleId || null;

    if (vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { seller: true },
      });

      if (!vehicle) {
        throw new NotFoundException(`Veículo com ID ${vehicleId} não encontrado.`);
      }

      sellerId = vehicle.seller.userId;
    } else {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        include: { sellerProfile: true },
      });

      if (!listing) {
        throw new NotFoundException(`Anúncio com ID ${listingId} não encontrado.`);
      }

      sellerId = listing.sellerProfile.userId;
    }

    if (buyerId === sellerId) {
      throw new ForbiddenException('Vendedores não podem iniciar chat no próprio anúncio/veículo.');
    }

    // Busca ou cria a sala de chat (idempotente)
    // Usamos findFirst/create em vez de upsert por causa da unicidade condicional
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        buyerId,
        listingId: targetListingId,
        vehicleId: targetVehicleId,
      },
      include: {
        listing: {
          select: {
            title: true,
            vehicle: {
              select: {
                version: { include: { model: { include: { brand: true } } } },
                photos: { where: { order: 0 }, take: 1 },
              },
            },
          },
        },
        vehicle: {
          select: {
            version: { include: { model: { include: { brand: true } } } },
            photos: { where: { order: 0 }, take: 1 },
          },
        },
        buyer: { select: { name: true, avatar: true } },
        seller: { select: { name: true, avatar: true } },
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          buyerId,
          sellerId,
          listingId: targetListingId,
          vehicleId: targetVehicleId,
        },
        include: {
          listing: {
            select: {
              title: true,
              vehicle: {
                select: {
                  version: { include: { model: { include: { brand: true } } } },
                  photos: { where: { order: 0 }, take: 1 },
                },
              },
            },
          },
          vehicle: {
            select: {
              version: { include: { model: { include: { brand: true } } } },
              photos: { where: { order: 0 }, take: 1 },
            },
          },
          buyer: { select: { name: true, avatar: true } },
          seller: { select: { name: true, avatar: true } },
        },
      });
    }

    return room;
  }

    /**
   * Finds all active rooms for a given user.
   * Room mapping logic has been extracted to mapRoomToResponse.
   */
  async findMyRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
        isActive: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        listing: {
          select: {
            title: true,
            vehicle: {
              select: {
                version: { include: { model: { include: { brand: true } } } },
                photos: { where: { order: 0 }, take: 1 },
              },
            },
          },
        },
        vehicle: {
          select: {
            version: { include: { model: { include: { brand: true } } } },
            photos: { where: { order: 0 }, take: 1 },
          },
        },
        buyer: { select: { name: true, avatar: true } },
        seller: { select: { name: true, avatar: true } },
        reads: { where: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (rooms.length === 0) {
      return [];
    }

    const unreadCountsRaw = await this.prisma.chatMessage.groupBy({
      by: ['roomId'],
      where: {
        OR: rooms.map(room => ({
          roomId: room.id,
          senderId: { not: userId },
          createdAt: { gt: room.reads?.[0]?.lastReadAt || new Date(0) }
        }))
      },
      _count: { _all: true }
    });

    const unreadCountMap = new Map(unreadCountsRaw.map(u => [u.roomId, u._count._all]));

    return Promise.all(rooms.map((room) => this.mapRoomToResponse(room, userId, unreadCountMap.get(room.id) || 0)));
  }

  async findRoomById(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        listing: {
          select: {
            id: true,
            title: true,
            vehicle: {
              select: {
                version: { include: { model: { include: { brand: true } } } },
                photos: { where: { order: 0 }, take: 1 },
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            version: { include: { model: { include: { brand: true } } } },
            photos: { where: { order: 0 }, take: 1 },
          },
        },
        buyer: { select: { id: true, name: true, avatar: true } },
        seller: { select: { id: true, name: true, avatar: true } },
        reads: { where: { userId } },
      },
    });

    if (!room) {
      throw new NotFoundException(`Sala de chat com ID ${roomId} não encontrada.`);
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta conversa.');
    }

    return this.mapRoomToResponse(room, userId);
  }

  async findMessages(roomId: string, userId: string, cursor?: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Sala de chat com ID ${roomId} não encontrada.`);
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta conversa.');
    }

    const limit = 20;
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items: messages,
      nextCursor,
    };
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Sala de chat com ID ${roomId} não encontrada.`);
    }

    if (room.buyerId !== senderId && room.sellerId !== senderId) {
      throw new ForbiddenException('Você não tem permissão para enviar mensagens nesta conversa.');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
      },
    });

    // Atualizar o updatedAt da sala para ordenar a lista de conversas
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Envia a mensagem para o stream em tempo real
    const stream = this.getOrCreateStream(roomId);
    stream.next(message);

    return message;
  }

  async markAsRead(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Sala de chat com ID ${roomId} não encontrada.`);
    }

    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException('Você não tem permissão para ler esta conversa.');
    }

    await this.prisma.chatRead.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      create: {
        roomId,
        userId,
        lastReadAt: new Date(),
      },
      update: {
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }
}
