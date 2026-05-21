import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto) {
    const { listingId, reportedUserId, chatRoomId, category, reason } = dto;

    if (!listingId && !reportedUserId && !chatRoomId) {
      throw new BadRequestException('É necessário informar o que está sendo denunciado (anúncio, usuário ou chat).');
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId: reportedUserId,
        listingId,
        chatRoomId,
        category,
        reason,
        status: ReportStatus.PENDING,
      },
    });
  }

  async findAll() {
    return this.prisma.report.findMany({
      include: {
        reporter: { select: { name: true, email: true } },
        reported: { select: { name: true, email: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ReportStatus, moderatorId: string, resolutionNotes?: string) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        moderatorId,
        moderatorNotes: resolutionNotes,
        resolvedAt: status !== ReportStatus.PENDING ? new Date() : null,
      },
    });
  }
}
