import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CallCenterTicketService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.CallCenterTicketCreateInput) {
    return this.prisma.callCenterTicket.create({ data });
  }

  findAll() {
    return this.prisma.callCenterTicket.findMany({
      orderBy: { date: 'desc' },
      include: {
        quoteRequest: true,
        client: true
      }
    });
  }

  findOne(id: string) {
    return this.prisma.callCenterTicket.findUnique({
      where: { id },
      include: {
        quoteRequest: true,
        client: true
      }
    });
  }

  update(id: string, data: Prisma.CallCenterTicketUpdateInput) {
    return this.prisma.callCenterTicket.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.callCenterTicket.delete({
      where: { id },
    });
  }
}
