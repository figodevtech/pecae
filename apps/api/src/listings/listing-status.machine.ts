import { BadRequestException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

export class ListingStatusMachine {
  private static readonly VALID_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
    [ListingStatus.DRAFT]: [ListingStatus.PENDING, ListingStatus.SOLD, ListingStatus.DRAFT],
    [ListingStatus.PENDING]: [ListingStatus.PUBLISHED, ListingStatus.REJECTED, ListingStatus.PENDING],
    [ListingStatus.PUBLISHED]: [ListingStatus.SOLD, ListingStatus.EXPIRED, ListingStatus.DRAFT, ListingStatus.PUBLISHED],
    [ListingStatus.REJECTED]: [ListingStatus.PENDING, ListingStatus.REJECTED],
    [ListingStatus.SOLD]: [ListingStatus.PENDING, ListingStatus.SOLD],
    [ListingStatus.EXPIRED]: [ListingStatus.PENDING, ListingStatus.EXPIRED],
  };

  /**
   * Valida se a transição do status atual (from) para o novo status (to) é permitida.
   * Lança um BadRequestException caso a transição seja inválida.
   */
  static validateTransition(from: ListingStatus, to: ListingStatus): void {
    if (!from) {
      return; // Tolera status indefinido (comum em mocks de testes unitários)
    }
    if (from === to) {
      return;
    }

    const allowedDestinations = this.VALID_TRANSITIONS[from];
    if (!allowedDestinations || !allowedDestinations.includes(to)) {
      throw new BadRequestException(
        `Transição de status inválida para o anúncio: não é possível alterar de ${from} para ${to}`
      );
    }
  }
}
