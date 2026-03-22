import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrscanlogService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    if (!data.id) {
       const crypto = require('crypto');
       data.id = crypto.randomUUID();
    }
    return this.prisma.qRScanLog.create({ data });
  }

  async findAll() {
    return this.prisma.qRScanLog.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: string) {
    const scan = await this.prisma.qRScanLog.findUnique({ where: { id } });
    if (!scan) throw new NotFoundException(`QRScanLog with ID ${id} not found`);
    return scan;
  }

  async update(id: string, data: any) {
    return this.prisma.qRScanLog.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.qRScanLog.delete({ where: { id } });
  }
}
