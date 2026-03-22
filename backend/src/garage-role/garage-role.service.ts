import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GarageRoleService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.garageRole.findMany(); }
  findOne(id: string) { return this.prisma.garageRole.findUnique({ where: { id } }); }

  create(data: any) {
    const crypto = require('crypto');
    return this.prisma.garageRole.create({
      data: {
        id: data.id || crypto.randomUUID(),
        name: data.name, isSystem: data.isSystem ?? false,
        permissions: data.permissions || [], tenantId: data.tenantId,
      },
    });
  }

  update(id: string, data: any) {
    const { name, isSystem, permissions, tenantId } = data;
    const safeData: any = {};
    if (name !== undefined) safeData.name = name;
    if (isSystem !== undefined) safeData.isSystem = isSystem;
    if (permissions !== undefined) safeData.permissions = permissions;
    // tenantId cannot be changed after creation — intentionally excluded
    return this.prisma.garageRole.update({ where: { id }, data: safeData });
  }
  remove(id: string) { return this.prisma.garageRole.delete({ where: { id } }); }
}
