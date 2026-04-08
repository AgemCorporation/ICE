import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  private mapToPrisma(client: any): Prisma.ClientCreateInput {
    const { address, financial, incomp, tenant, invoices, ...rest } = client;
    const finalEmail = (client.email && client.email.trim() !== '') 
      ? client.email.trim() 
      : `no-email-${client.id || Date.now()}@ice.local`;

    return {
      ...rest,
      email: finalEmail,
      street: address?.street || '',
      city: address?.city || '',
      commune: address?.commune,
      zip: address?.zip || '',
      paymentMethod: financial?.paymentMethod || 'Espèces',
      paymentTerms: financial?.paymentTerms || 'Comptant',
      discountPercent: financial?.discountPercent || 0,
      balance: financial?.balance || 0,
      vehicleIds: client.vehicleIds || [],
      history: client.history || [],
      fleetSize: client.fleetSize || 0,
    } as Prisma.ClientCreateInput;
  }

  private mapToFront(client: any) {
    if (!client) return null;
    const { password, ...rest } = client;
    return {
      ...rest,
      email: rest.email?.includes('@ice.local') ? '' : rest.email,
      address: {
        street: client.street,
        city: client.city,
        commune: client.commune,
        zip: client.zip
      },
      financial: {
        paymentMethod: client.paymentMethod,
        paymentTerms: client.paymentTerms,
        discountPercent: client.discountPercent,
        balance: client.balance
      },
      vehicleIds: client.vehicleIds || [],
      history: client.history || [],
      fleetSize: client.fleetSize || 0,
      avatarUrl: client.avatarUrl
    };
  }

  async create(data: any) {
    try {
      const prismaData = this.mapToPrisma(data);
      const { id: _id, ...updateData } = prismaData as any;
      
      // 1. Find existing client by ID, Email, or Phone
      let existingClient = await this.prisma.client.findFirst({
        where: {
          OR: [
            data.id ? { id: data.id } : {},
            (data.email && data.email !== '') ? { email: data.email } : {},
            (data.phone && data.phone !== '') ? { phone: data.phone } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      });

      let client;
      if (existingClient) {
        // Safe Upsert Logic: Prevent Garage interfaces from overwriting Mobile User real data with partial/dummy data.
        if (updateData.email && updateData.email.toString().includes('@ice.local') && existingClient.email && !existingClient.email.includes('@ice.local')) {
           delete (updateData as any).email;
        }
        if (updateData.street === 'Via Pro Devis Auto' && existingClient.street && existingClient.street !== '') {
           delete (updateData as any).street;
           delete (updateData as any).city;
        }
        
        // Prevent accidental downgrade from Entreprise to Particulier (often caused by incomplete front-end dummy updates)
        if (existingClient.type === 'Entreprise' && updateData.type === 'Particulier') {
           delete (updateData as any).type;
        }

        client = await this.prisma.client.update({
          where: { id: existingClient.id },
          data: updateData,
        });
      } else {
        client = await this.prisma.client.create({
          data: prismaData,
        });
      }
      return this.mapToFront(client);
    } catch (e: any) {
      require('fs').appendFileSync('/tmp/backend-error.log', `Client upsert error: ${e.message}\n${e.stack}\nData: ${JSON.stringify(data)}\n`);
      throw e;
    }
  }

  async findAll(tenantId?: string) {
    const clients = await this.prisma.client.findMany({
      where: tenantId ? { tenantId } : undefined,
    });
    return clients.map(c => this.mapToFront(c));
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    return this.mapToFront(client);
  }

  async update(id: string, data: any) {
    const prismaData = this.mapToPrisma(data);
    
    // Prevent accidental downgrade from Entreprise to Particulier
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (existing && existing.type === 'Entreprise' && prismaData.type === 'Particulier') {
       delete (prismaData as any).type;
    }
    
    const client = await this.prisma.client.update({
      where: { id },
      data: prismaData,
    });
    return this.mapToFront(client);
  }

  async remove(id: string) {
    const client = await this.prisma.client.delete({ where: { id } });
    return this.mapToFront(client);
  }

  // ==== MOBILE AUTH ====
  
  async mobileRegister(data: any) {
    const existing = await this.prisma.client.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('DOCUMENT_EXISTS');
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create base data for Prisma
    const prismaData: any = this.mapToPrisma(data);
    prismaData.password = hashedPassword; // Inject password

    const client = await this.prisma.client.create({ data: prismaData });
    
    // Generate JWT token for the new client
    const payload = { sub: client.id, type: 'client' };
    const token = await this.jwtService.signAsync(payload);

    // Send welcome email (fire-and-forget — don't block registration)
    const realEmail = client.email && !client.email.includes('@ice.local') ? client.email : null;
    if (realEmail) {
      this.mailService.sendWelcomeEmail(realEmail, client.firstName || 'Cher client').catch((err) => {
        this.logger.error(`Welcome email failed for ${realEmail}: ${err.message}`);
      });
    }

    return { user: this.mapToFront(client), token };
  }

  async mobileLogin(data: any) {
    const client = await this.prisma.client.findUnique({ where: { email: data.email } });
    if (!client) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (!client.password) {
      throw new UnauthorizedException('OLD_ACCOUNT_NO_PASSWORD');
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(data.password, client.password);
    
    if (!isValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const payload = { sub: client.id, type: 'client' };
    const token = await this.jwtService.signAsync(payload);

    return { user: this.mapToFront(client), token };
  }

  async updatePushToken(phone: string, pushToken: string) {
    // Find the client by phone
    const client = await this.prisma.client.findFirst({ where: { phone } });
    if (!client) {
      throw new UnauthorizedException('CLIENT_NOT_FOUND');
    }

    return this.prisma.client.update({
      where: { id: client.id },
      data: { pushToken }
    });
  }

  async forgotPassword(email: string) {
    const client = await this.prisma.client.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (!client) {
      throw new UnauthorizedException('CLIENT_NOT_FOUND');
    }

    // Generate a random 8-char temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.client.update({
      where: { id: client.id },
      data: { password: hashedPassword }
    });

    return { success: true, tempPassword, firstName: client.firstName };
  }

  async changePassword(clientId: string, oldPassword: string, newPassword: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new UnauthorizedException('CLIENT_NOT_FOUND');
    }

    const bcrypt = await import('bcrypt');

    // Verify old password
    if (client.password) {
      const isBcrypt = client.password.startsWith('$2');
      if (isBcrypt) {
        const isValid = await bcrypt.compare(oldPassword, client.password);
        if (!isValid) throw new UnauthorizedException('WRONG_PASSWORD');
      } else {
        if (client.password !== oldPassword) throw new UnauthorizedException('WRONG_PASSWORD');
      }
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await this.prisma.client.update({
      where: { id: clientId },
      data: { password: hashedNew }
    });

    return { success: true };
  }

  async updateAvatar(clientId: string, base64: string) {
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new UnauthorizedException('CLIENT_NOT_FOUND');

    if (!base64 || base64.trim() === '') {
      const updated = await this.prisma.client.update({
        where: { id: clientId },
        data: { avatarUrl: null }
      });
      return this.mapToFront(updated);
    }

    // Store the base64 directly in the database to prevent ephemeral storage loss on Render.
    // The mobile app compresses it to ~200KB first.
    let avatarDest = base64;
    if (!base64.startsWith('data:image/')) {
       avatarDest = 'data:image/jpeg;base64,' + base64;
    }

    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data: { avatarUrl: avatarDest }
    });

    return this.mapToFront(updated);
  }
}

