import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockMovementService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.stockMovement.findMany(); }
  findOne(id: string) { return this.prisma.stockMovement.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.stockMovement.create({
      data: {
        id: data.id || crypto.randomUUID(), partId: data.partId, date: data.date,
        type: data.type, quantity: data.quantity, reason: data.reason || '',
        userId: data.userId, recipient: data.recipient, tenantId: data.tenantId,
      },
    });
  }

  update(id: string, data: any) { return this.prisma.stockMovement.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.stockMovement.delete({ where: { id } }); }
}
