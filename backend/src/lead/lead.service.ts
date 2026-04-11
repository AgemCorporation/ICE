import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.platformLead.findMany({ orderBy: { date: 'desc' } }); }
  findOne(id: string) { return this.prisma.platformLead.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.platformLead.create({
      data: {
        id: data.id || crypto.randomUUID(),
        garageName: data.garageName,
        contactName: data.contactName,
        email: data.email || null,
        phone: data.phone,
        city: data.city || null,
        vehiclesPerDay: data.vehiclesPerDay || null,
        equipment: data.equipment || null,
        planInterest: data.planInterest || 'ICE Light',
        status: data.status || 'New',
        date: data.date || new Date().toISOString(),
        notes: data.notes || null,
      },
    });
  }

  update(id: string, data: any) { return this.prisma.platformLead.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.platformLead.delete({ where: { id } }); }
}
