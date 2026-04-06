import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class RepairService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway
  ) {}

  async findAll(tenantId?: string, clientId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (clientId) where.clientId = clientId;

    return this.prisma.repairOrder.findMany({
      where,
    });
  }

  async findOne(id: string) {
    return this.prisma.repairOrder.findUnique({ where: { id } });
  }

  async create(data: any) {
    const crypto = require('crypto');
    const result = await this.prisma.repairOrder.create({
      data: {
        id: data.id || crypto.randomUUID(),
        vehicleId: data.vehicleId,
        clientId: data.clientId,
        status: data.status || 'En attente',
        entryDate: data.entryDate,
        description: data.description || '',
        mechanic: data.mechanic,
        items: data.items || [],
        checkIn: data.checkIn || null,
        history: data.history || [],
        downPayments: data.downPayments || [],
        isLocked: data.isLocked || false,
        timeLogs: data.timeLogs || [],
        vatRate: data.vatRate ?? 18,
        discountValue: data.discountValue ?? 0,
        discountType: data.discountType,
        financialNotes: data.financialNotes,
        tenantId: data.tenantId,
      },
    });
    this.eventsGateway.broadcastDataUpdate('repair', 'create');
    return result;
  }

  async update(id: string, data: any) {
    // Whitelist allowed fields to prevent tenantId or id injection
    const ALLOWED = [
      'vehicleId', 'clientId', 'status', 'entryDate', 'description',
      'mechanic', 'items', 'checkIn', 'history', 'downPayments',
      'isLocked', 'timeLogs', 'vatRate', 'discountValue', 'discountType',
      'financialNotes',
    ];
    const safeData: any = {};
    for (const key of ALLOWED) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
    const existing = await this.prisma.repairOrder.findUnique({ where: { id } });

    const updated = await this.prisma.repairOrder.update({ where: { id }, data: safeData });

    // Notify user on repair order status change
    if (existing && data.status && existing.status !== data.status) {
      const client = await this.prisma.client.findUnique({ where: { id: updated.clientId } });
      if (client && client.phone) {
         this.notificationsService.sendPushNotificationToClient(
             client.phone,
             `Mise à jour des travaux`,
             `Le statut de vos travaux est passé à : ${data.status}`,
             { type: 'REPAIR_ORDER', id }
         );
      }
    }

    this.eventsGateway.broadcastDataUpdate('repair', 'update');

    return updated;
  }

  async remove(id: string) {
    const result = await this.prisma.repairOrder.delete({ where: { id } });
    this.eventsGateway.broadcastDataUpdate('repair', 'delete');
    return result;
  }
}
