import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.supplier.findMany(); }
  findOne(id: string) { return this.prisma.supplier.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.supplier.create({
      data: {
        id: data.id || crypto.randomUUID(),
        name: data.name, contactName: data.contactName, email: data.email,
        phone: data.phone, deliveryDelayDays: data.deliveryDelayDays ?? 0,
        address: data.address, isArchived: data.isArchived ?? false, tenantId: data.tenantId,
      },
    });
  }

  update(id: string, data: any) { return this.prisma.supplier.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.supplier.delete({ where: { id } }); }
}
