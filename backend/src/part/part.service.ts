import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.part.findMany(); }
  findOne(id: string) { return this.prisma.part.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.part.create({
      data: {
        id: data.id || crypto.randomUUID(),
        reference: data.reference, oem: data.oem, name: data.name,
        brand: data.brand, category: data.category, image: data.image,
        buyPrice: data.buyPrice ?? 0, sellPrice: data.sellPrice ?? 0,
        vatRate: data.vatRate ?? 18, marginPercent: data.marginPercent ?? 0,
        stock: data.stock ?? 0, minStock: data.minStock ?? 0, reorderQty: data.reorderQty ?? 0,
        location: data.location, warehouseId: data.warehouseId, supplierId: data.supplierId,
        priceHistory: data.priceHistory || [], tenantId: data.tenantId,
      },
    });
  }

  update(id: string, data: any) { return this.prisma.part.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.part.delete({ where: { id } }); }
}
