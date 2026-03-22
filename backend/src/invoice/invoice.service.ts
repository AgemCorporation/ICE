import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway
  ) {}

  async create(data: any) {
    if (!data.id) {
       const crypto = require('crypto');
       data.id = crypto.randomUUID();
    }
    // Handle items manually or cast date
    if (data.date) data.date = new Date(data.date).toISOString();
    if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString();
    if (data.restitutionDate === '') data.restitutionDate = null;
    if (data.restitutionDate) data.restitutionDate = new Date(data.restitutionDate).toISOString();

    const { items, ...invoiceData } = data;

    const result = await this.prisma.invoice.create({
      data: {
        ...invoiceData,
        items: items ? {
          create: items.map(i => {
             const { id, ...itemData } = i;
             return itemData;
          })
        } : undefined
      },
      include: { items: true }
    });
    this.eventsGateway.broadcastDataUpdate('invoice', 'create');
    return result;
  }

  async findAll(tenantId?: string) {
    return this.prisma.invoice.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { date: 'desc' },
      include: { items: true }
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
       where: { id },
       include: { items: true }
    });
    if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return invoice;
  }

  async update(id: string, data: any) {
    if (data.date) data.date = new Date(data.date).toISOString();
    if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString();
    if (data.restitutionDate === '') data.restitutionDate = null;
    if (data.restitutionDate) data.restitutionDate = new Date(data.restitutionDate).toISOString();

    const { items, ...invoiceData } = data;

    const existing = await this.prisma.invoice.findUnique({ where: { id } });

    // We first update the main invoice
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: invoiceData,
    });

    // Notify user if invoice is sent/validated
    if (existing && invoiceData.status && existing.status !== invoiceData.status) {
      if (['ENVOYE', 'VALIDE', 'PAYE', 'PARTIEL'].includes(invoiceData.status)) {
        const docType = updatedInvoice.type === 'DEVIS' ? 'devis' : 'facture';
        const client = await this.prisma.client.findUnique({ where: { id: updatedInvoice.clientId } });
        if (client && client.phone) {
           this.notificationsService.sendPushNotificationToClient(
               client.phone,
               `Nouveau ${docType}`,
               `Le ${docType} ${updatedInvoice.number} est maintenant disponible (${invoiceData.status}).`,
               { type: updatedInvoice.type, id }
           );
        }
      }
    }

    // Handle nested items if provided
    if (items && Array.isArray(items)) {
       // Delete old items
       await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
       // Insert new items
       if (items.length > 0) {
          await this.prisma.invoiceItem.createMany({
             data: items.map(i => {
                const { id: itemId, ...itemData } = i;
                return { ...itemData, invoiceId: id };
             })
          });
       }
    }

    const result = await this.prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    this.eventsGateway.broadcastDataUpdate('invoice', 'update');
    return result;
  }

  async remove(id: string) {
    const result = await this.prisma.invoice.delete({ where: { id } });
    this.eventsGateway.broadcastDataUpdate('invoice', 'delete');
    return result;
  }
}
