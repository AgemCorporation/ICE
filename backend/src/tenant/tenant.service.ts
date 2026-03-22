import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Exhaustive list of scalar columns in the Tenant table.
// Relational arrays (users, clients, vehicles, invoices) are excluded
// so Prisma never receives unknown fields.
const TENANT_FIELDS = [
  'id', 'name', 'description', 'domain', 'adminEmail', 'password',
  'contactName', 'phone', 'address', 'city', 'commune', 'zip', 'country',
  'vatNumber', 'plan', 'status', 'userCount', 'maxUsers', 'storageUsed',
  'storageLimit', 'mrr', 'lat', 'lng', 'lockedGps', 'rating', 'reviewCount',
  'features', 'settings', 'createdAt', 'expiresAt',
];

function pickTenantFields(data: any) {
  const out: any = {};
  for (const key of TENANT_FIELDS) {
    if (key in data && data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

function serializeTenant(tenant: any) {
  const out: any = {};
  for (const key of TENANT_FIELDS) {
    if (key in tenant) {
      const v = tenant[key];
      // Convert Date objects to ISO strings for the frontend
      out[key] = v instanceof Date ? v.toISOString() : v;
    }
  }
  return out;
}

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    const crypto = require('crypto');
    const prismaData = pickTenantFields(data);
    if (!prismaData.id) prismaData.id = crypto.randomUUID();
    if (prismaData.createdAt) prismaData.createdAt = new Date(prismaData.createdAt);
    if (prismaData.expiresAt) prismaData.expiresAt = new Date(prismaData.expiresAt);
    else prismaData.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Hash password if present and not already hashed
    if (prismaData.password && !prismaData.password.startsWith('$2')) {
      const bcrypt = await import('bcrypt');
      prismaData.password = await bcrypt.hash(prismaData.password, 10);
    }

    try {
      const result = await this.prisma.tenant.create({ data: prismaData });
      return serializeTenant(result);
    } catch (err) {
      console.error('[TenantService.create] Prisma Error:', JSON.stringify(err, null, 2));
      throw err;
    }
  }

  async findAll() {
    const list = await this.prisma.tenant.findMany();
    return list.map(serializeTenant);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not found`);
    return serializeTenant(tenant);
  }

  async update(id: string, data: any) {
    const prismaData = pickTenantFields(data);
    delete prismaData.id; // id is the where clause, not a data field
    if (prismaData.createdAt) prismaData.createdAt = new Date(prismaData.createdAt);
    if (prismaData.expiresAt) prismaData.expiresAt = new Date(prismaData.expiresAt);

    // Hash password if present and not already hashed
    if (prismaData.password && !prismaData.password.startsWith('$2')) {
      const bcrypt = await import('bcrypt');
      prismaData.password = await bcrypt.hash(prismaData.password, 10);
    }

    try {
      const result = await this.prisma.tenant.update({
        where: { id },
        data: prismaData,
      });
      return serializeTenant(result);
    } catch (err) {
      console.error('[TenantService.update] Prisma Error:', JSON.stringify(err, null, 2));
      throw err;
    }
  }

  async remove(id: string) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}
