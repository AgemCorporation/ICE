import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabourRateService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.labourRate.findMany(); }
  findOne(id: string) { return this.prisma.labourRate.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.labourRate.create({
      data: { id: data.id || crypto.randomUUID(), code: data.code, name: data.name, hourlyRate: data.hourlyRate ?? 0, tenantId: data.tenantId },
    });
  }

  update(id: string, data: any) { return this.prisma.labourRate.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.labourRate.delete({ where: { id } }); }
}
