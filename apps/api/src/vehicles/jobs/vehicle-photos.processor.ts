import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { PhotoType, VehicleStatus, ListingStatus } from '@prisma/client';

interface ProcessPhotoPayload {
  vehicleId: string;
  photos: {
    url: string;
    type: PhotoType;
    order: number;
  }[];
}

@Processor('vehicle-photos')
export class VehiclePhotosProcessor extends WorkerHost {
  private readonly logger = new Logger(VehiclePhotosProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<ProcessPhotoPayload>): Promise<any> {
    const { vehicleId, photos } = job.data;
    this.logger.log(`Iniciando processamento assíncrono de ${photos.length} fotos para o veículo ${vehicleId}`);

    // Array para rastrear os arquivos novos criados com sucesso no storage
    // Se houver falha, usaremos esse array para deletar os arquivos e evitar lixo (Option B - Atomicidade)
    const uploadedFiles: string[] = [];
    const processedPhotosRecords: { url: string; type: PhotoType; order: number }[] = [];

    try {
      for (const photo of photos) {
        this.logger.debug(`Baixando foto original: ${photo.url}`);
        
        // 1. Download da foto original bruta
        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`Falha ao baixar imagem original: ${response.statusText} (${photo.url})`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Processamento com Sharp
        this.logger.debug(`Processando imagem ${photo.order} com Sharp`);
        
        // Redimensionar para largura de 1200px (mantendo proporção e convertendo para JPEG leve)
        const processedBuffer = await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();

        // Gerar thumbnail de 400x300px (fit cover)
        const thumbBuffer = await sharp(buffer)
          .resize({ width: 400, height: 300, fit: 'cover' })
          .jpeg({ quality: 75, progressive: true })
          .toBuffer();

        // 3. Upload dos arquivos processados para o Storage
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const filename = `photo_${Date.now()}_${uniqueId}.jpg`;
        
        const processedPath = `vehicles/${vehicleId}/processed/${filename}`;
        const thumbPath = `vehicles/${vehicleId}/processed/thumb_${filename}`;

        this.logger.debug(`Subindo arquivos processados para o Supabase Storage`);
        
        // Upload da foto principal
        const processedUrl = await this.storageService.uploadFile(
          'vehicle-photos',
          processedPath,
          processedBuffer,
          'image/jpeg',
        );
        uploadedFiles.push(processedPath);

        // Upload do thumbnail
        await this.storageService.uploadFile(
          'vehicle-photos',
          thumbPath,
          thumbBuffer,
          'image/jpeg',
        );
        uploadedFiles.push(thumbPath);

        // Armazenar as informações de sucesso
        processedPhotosRecords.push({
          url: processedUrl,
          type: photo.type,
          order: photo.order,
        });

        // 4. Deletar a foto bruta original para economizar espaço
        try {
          const bucketMarker = 'vehicle-photos/';
          const bucketIndex = photo.url.indexOf(bucketMarker);
          if (bucketIndex !== -1) {
            const pathWithToken = photo.url.substring(bucketIndex + bucketMarker.length);
            const rawPath = pathWithToken.split('?')[0];
            
            this.logger.debug(`Limpando arquivo bruto original: ${rawPath}`);
            await this.storageService.deleteFile('vehicle-photos', rawPath);
          }
        } catch (cleanupErr) {
          // Apenas logar erro de limpeza da foto bruta para não travar o processo principal
          this.logger.warn(`Não foi possível remover a foto bruta antiga: ${cleanupErr.message}`);
        }
      }

      // 5. Salvar registros finais de sucesso no banco em transação atômica
      this.logger.log(`Persistindo registros de fotos no banco para o veículo ${vehicleId}`);
      
      await this.prisma.$transaction(async (tx) => {
        // Garantir remoção de qualquer resquício anterior de foto
        await tx.vehiclePhoto.deleteMany({
          where: { vehicleId },
        });

        // Inserir as novas fotos processadas
        await tx.vehiclePhoto.createMany({
          data: processedPhotosRecords.map((p) => ({
            vehicleId,
            url: p.url,
            type: p.type,
            order: p.order,
          })),
        });

        // Atualizar status do veículo para PENDING para moderação
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: VehicleStatus.PENDING },
        });

        // Atualizar status do Listing para PENDING
        await tx.listing.updateMany({
          where: { vehicleId },
          data: {
            status: ListingStatus.PENDING,
            publishedAt: null,
          },
        });
      });

      this.logger.log(`Processamento das fotos do veículo ${vehicleId} concluído com sucesso!`);
      return { status: 'success', vehicleId, count: processedPhotosRecords.length };

    } catch (error) {
      this.logger.error(`Erro crítico no processamento de fotos do veículo ${vehicleId}: ${error.message}`);
      
      // Limpeza Preventiva de arquivos criados no Storage caso dê erro (Option B)
      this.logger.warn(`Iniciando limpeza preventiva de ${uploadedFiles.length} arquivos no Storage devido a erro`);
      for (const filePath of uploadedFiles) {
        try {
          await this.storageService.deleteFile('vehicle-photos', filePath);
        } catch (cleanupErr) {
          this.logger.error(`Falha ao limpar arquivo órfão ${filePath}: ${cleanupErr.message}`);
        }
      }

      // Reverter status do veículo e listing para DRAFT para que o vendedor possa corrigir
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.vehicle.update({
            where: { id: vehicleId },
            data: { status: VehicleStatus.DRAFT },
          });

          await tx.listing.updateMany({
            where: { vehicleId },
            data: { status: ListingStatus.DRAFT },
          });
        });
      } catch (dbErr) {
        this.logger.error(`Falha ao reverter veículo ${vehicleId} para DRAFT: ${dbErr.message}`);
      }

      // Lançar o erro novamente para que o BullMQ registre falha no Job
      throw error;
    }
  }
}
