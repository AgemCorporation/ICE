import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.warehouse.findMany(); }
  findOne(id: string) { return this.prisma.warehouse.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.warehouse.create({
      data: { id: data.id || crypto.randomUUID(), name: data.name, address: data.address, tenantId: data.tenantId },
    });
  }

  update(id: string, data: any) { return this.prisma.warehouse.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.warehouse.delete({ where: { id } }); }
}
