import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicePackageService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.servicePackage.findMany(); }
  findOne(id: string) { return this.prisma.servicePackage.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.servicePackage.create({
      data: {
        id: data.id || crypto.randomUUID(), name: data.name, description: data.description || '',
        price: data.price ?? 0, partIds: data.partIds || [], tenantId: data.tenantId,
      },
    });
  }

  update(id: string, data: any) { return this.prisma.servicePackage.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.servicePackage.delete({ where: { id } }); }
}
