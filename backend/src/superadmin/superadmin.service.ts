import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Whitelist of fields allowed for SuperAdmin creation/update
const ADMIN_ALLOWED_FIELDS = [
    'firstName', 'lastName', 'email', 'password', 'active', 'superAdminPerms',
];

function pickAdminFields(data: any): any {
    const result: any = {};
    for (const key of ADMIN_ALLOWED_FIELDS) {
        if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
}

@Injectable()
export class SuperadminService {
    constructor(private prisma: PrismaService) { }

    // 1. Get all SuperAdmins (Root + SuperAdmin)
    async getAdmins() {
        return this.prisma.appUser.findMany({
            where: {
                role: { in: ['Root', 'SuperAdmin'] },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                active: true,
                superAdminPerms: true,
                createdBy: true,
            },
            orderBy: { firstName: 'asc' },
        });
    }

    // 2. Create a new SuperAdmin (whitelisted fields only)
    async createAdmin(data: any, rootUserId: string, rootUserName: string) {
        const safeData = pickAdminFields(data);
        const crypto = require('crypto');
        const newAdmin = await this.prisma.appUser.create({
            data: {
                id: crypto.randomUUID(),
                ...safeData,
                role: 'SuperAdmin', // Always forced — cannot be overridden
                tenantId: null,
                createdBy: rootUserId,
            },
        });

        await this.logAction(
            rootUserId,
            rootUserName,
            'CREATED_ADMIN',
            newAdmin.id,
            `Created SuperAdmin: ${newAdmin.email}`
        );

        return newAdmin;
    }

    // 3. Update an existing SuperAdmin (whitelisted fields only)
    async updateAdmin(id: string, data: any, rootUserId: string, rootUserName: string) {
        const existing = await this.prisma.appUser.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Admin not found');
        if (existing.role === 'Root') {
            throw new Error('Cannot modify the Root administrator');
        }

        const safeData = pickAdminFields(data);
        const updated = await this.prisma.appUser.update({
            where: { id },
            data: safeData,
        });

        await this.logAction(
            rootUserId,
            rootUserName,
            'UPDATED_ADMIN',
            updated.id,
            `Updated permissions for: ${updated.email}`
        );

        return updated;
    }

    // 4. Delete/Disable SuperAdmin
    async removeAdmin(id: string, rootUserId: string, rootUserName: string) {
        const existing = await this.prisma.appUser.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Admin not found');
        if (existing.role === 'Root') {
            throw new Error('Cannot delete the Root administrator');
        }

        await this.prisma.appUser.delete({ where: { id } });

        await this.logAction(
            rootUserId,
            rootUserName,
            'DELETED_ADMIN',
            id,
            `Deleted SuperAdmin: ${existing.email}`
        );

        return { success: true };
    }

    // 5. Get Audit Logs
    async getAuditLogs() {
        return this.prisma.adminAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to recent 100 for now
        });
    }

    // 6. Generic Log Action
    async logAction(adminId: string, adminName: string, action: string, targetId?: string, details?: string) {
        return this.prisma.adminAuditLog.create({
            data: {
                adminId,
                adminName,
                action,
                targetId,
                details,
            },
        });
    }
}
