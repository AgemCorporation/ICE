import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class QuoteRequestService {
    constructor(
      private prisma: PrismaService,
      private notificationsService: NotificationsService,
      private eventsGateway: EventsGateway
    ) { }

    async create(data: any) {
        if (!data.id) {
            const crypto = require('crypto');
            data.id = crypto.randomUUID();
        }
        if (typeof data.vehicleYear === 'string') data.vehicleYear = parseInt(data.vehicleYear, 10) || null;
        if (typeof data.mileage === 'string') data.mileage = parseInt(data.mileage, 10) || null;
        if (data.interventionDate === '') data.interventionDate = null;
        if (data.preferredDate === '') data.preferredDate = null;
        if (data.assignedDate === '') data.assignedDate = null;
        
        if (data.interventionDate) data.interventionDate = new Date(data.interventionDate).toISOString();
        if (data.preferredDate) data.preferredDate = new Date(data.preferredDate).toISOString();
        
        const result = await this.prisma.quoteRequest.create({ data });
        this.eventsGateway.broadcastDataUpdate('quote-request', 'create');
        return result;
    }

    async findAll() {
        return this.prisma.quoteRequest.findMany({
            orderBy: { date: 'desc' }
        });
    }

    async findOne(id: string) {
        const request = await this.prisma.quoteRequest.findUnique({ where: { id } });
        if (!request) throw new NotFoundException(`QuoteRequest with ID ${id} not found`);
        return request;
    }

    async update(id: string, data: any) {
        if (typeof data.vehicleYear === 'string') data.vehicleYear = parseInt(data.vehicleYear, 10) || null;
        if (typeof data.mileage === 'string') data.mileage = parseInt(data.mileage, 10) || null;
        if (data.interventionDate === '') data.interventionDate = null;
        if (data.preferredDate === '') data.preferredDate = null;
        if (data.assignedDate === '') data.assignedDate = null;
        
        if (data.interventionDate) data.interventionDate = new Date(data.interventionDate).toISOString();
        if (data.preferredDate) data.preferredDate = new Date(data.preferredDate).toISOString();
        
        const existing = await this.prisma.quoteRequest.findUnique({ where: { id } });

        const updated = await this.prisma.quoteRequest.update({
            where: { id },
            data,
        });

        // Push notification logic
        if (existing && data.status && existing.status !== data.status) {
            let statusLabel = data.status;
            let title = 'Mise à jour de votre demande';
            let message = '';

            switch(data.status) {
              case 'COMPLETED': 
                 statusLabel = 'Traitée'; 
                 message = `Le statut de votre demande a été mis à jour : ${statusLabel}`;
                 break;
              case 'REJECTED': 
                 statusLabel = 'Rejetée'; 
                 message = `Le statut de votre demande a été mis à jour : ${statusLabel}`;
                 break;
              case 'DISPATCHED': 
                 statusLabel = 'En analyse par les garages'; 
                 message = `Votre demande a bien été envoyée. Les garages procèdent à l'analyse pour vous proposer un devis.`;
                 break;
              case 'CONVERTED': 
                 statusLabel = 'Convertie en OR'; 
                 message = `Votre demande a abouti avec succès, les travaux sont en cours.`;
                 break;
              case 'QUOTE_SUBMITTED':
                 title = 'Nouveau devis reçu !';
                 message = `Vous avez reçu un nouveau devis pour votre demande.`;
                 break;
              default:
                 message = `Le statut de votre demande a été mis à jour : ${statusLabel}`;
                 break;
            }

            this.notificationsService.sendPushNotificationToClient(
                updated.motoristPhone,
                title,
                message,
                { type: 'QUOTE_REQUEST', id }
            );
        }

        this.eventsGateway.broadcastDataUpdate('quote-request', 'update');

        return updated;
    }

    async remove(id: string) {
        const result = await this.prisma.quoteRequest.delete({ where: { id } });
        this.eventsGateway.broadcastDataUpdate('quote-request', 'delete');
        return result;
    }
}
