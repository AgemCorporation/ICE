import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MotoristVehicleService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    if (!data.id) {
       const crypto = require('crypto');
       data.id = crypto.randomUUID();
    }
    if (typeof data.year === 'string') data.year = parseInt(data.year, 10) || null;
    if (typeof data.mileage === 'string') data.mileage = parseInt(data.mileage, 10) || 0;
    if (data.lastRevisionDate === '') data.lastRevisionDate = null;
    if (data.lastRevisionDate) data.lastRevisionDate = new Date(data.lastRevisionDate).toISOString();
    return this.prisma.motoristVehicle.create({ data });
  }

  async findAll(user: any) {
    if (!user) return [];
    if (user.type === 'client') {
        const client = await this.prisma.client.findUnique({ where: { id: user.sub } });
        if (!client) return [];
        return this.prisma.motoristVehicle.findMany({
            where: { ownerPhone: client.phone },
            orderBy: { createdAt: 'desc' }
        });
    }
    return this.prisma.motoristVehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.motoristVehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`MotoristVehicle with ID ${id} not found`);
    return vehicle;
  }

  async update(id: string, data: any) {
    if (typeof data.year === 'string') data.year = parseInt(data.year, 10) || null;
    if (typeof data.mileage === 'string') data.mileage = parseInt(data.mileage, 10) || 0;
    if (data.lastRevisionDate === '') data.lastRevisionDate = null;
    if (data.lastRevisionDate) data.lastRevisionDate = new Date(data.lastRevisionDate).toISOString();
    
    return this.prisma.motoristVehicle.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.motoristVehicle.delete({ where: { id } });
  }
}
