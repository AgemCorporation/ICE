import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Whitelisted fields that can be set via API requests.
// Sensitive fields like 'role', 'superAdminPerms', 'createdBy' are EXCLUDED
// and can only be set by trusted internal calls.
const ALLOWED_FIELDS = [
  'firstName', 'lastName', 'email', 'active', 'tenantId',
  'pinCode', 'password',
  'phone', 'jobTitle', 'hourlyCost', 'hiredDate',
  'address', 'contractType', 'contractEndDate',
  'documents', 'emergencyContact',
];

// Fields that only Root/internal operations can set
const PRIVILEGED_FIELDS = ['role', 'superAdminPerms', 'createdBy'];

function pickAllowedFields(data: any, includePrivileged = false): any {
  const allowed = includePrivileged ? [...ALLOWED_FIELDS, ...PRIVILEGED_FIELDS] : ALLOWED_FIELDS;
  const result: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a user. `isPrivileged` should be true only when called by
   * trusted internal code (e.g., superadmin service) that is allowed
   * to set role and permissions.
   */
  async create(data: any, isPrivileged = false) {
    const crypto = require('crypto');
    const prismaData = pickAllowedFields(data, isPrivileged);
    prismaData.id = data.id || crypto.randomUUID();

    if (prismaData.hiredDate) prismaData.hiredDate = new Date(prismaData.hiredDate);
    if (prismaData.contractEndDate) prismaData.contractEndDate = new Date(prismaData.contractEndDate);

    // Hash password if present
    if (prismaData.password && !prismaData.password.startsWith('$2')) {
      const bcrypt = await import('bcrypt');
      prismaData.password = await bcrypt.hash(prismaData.password, 10);
    }

    const user = await this.prisma.appUser.create({ data: prismaData });
    const { password, pinCode, ...safeUser } = user;
    return safeUser;
  }

  async findAll(tenantId?: string) {
    const users = await this.prisma.appUser.findMany({
      where: tenantId ? { tenantId } : undefined,
    });
    return users.map(({ password, pinCode, ...rest }) => rest);
  }

  async findPublicMechanics(tenantId: string) {
    const users = await this.prisma.appUser.findMany({
      where: { tenantId, role: 'Mecanicien', active: true },
      select: { id: true, firstName: true, lastName: true, role: true }
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.appUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { password, pinCode, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update a user. `isPrivileged` should be true only when called by
   * trusted internal code that is allowed to set role and permissions.
   */
  async update(id: string, data: any, isPrivileged = false) {
    const prismaData = pickAllowedFields(data, isPrivileged);

    if (prismaData.hiredDate) prismaData.hiredDate = new Date(prismaData.hiredDate);
    if (prismaData.contractEndDate) prismaData.contractEndDate = new Date(prismaData.contractEndDate);

    // Hash password if it's being updated and not already hashed
    if (prismaData.password && !prismaData.password.startsWith('$2')) {
      const bcrypt = await import('bcrypt');
      prismaData.password = await bcrypt.hash(prismaData.password, 10);
    }

    const user = await this.prisma.appUser.update({
      where: { id },
      data: prismaData,
    });
    const { password, pinCode, ...safeUser } = user;
    return safeUser;
  }

  async remove(id: string) {
    const user = await this.prisma.appUser.delete({ where: { id } });
    const { password, pinCode, ...safeUser } = user;
    return safeUser;
  }
}

