import { Controller, Get, Post, Patch, Delete, Body, Param, Req, ForbiddenException } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';

@Controller('superadmin')
export class SuperadminController {
    constructor(private readonly superadminService: SuperadminService) { }

    // Extract Root User from JWT payload (attached by JwtAuthGuard)
    private extractRootUser(req: any) {
        const user = req.user; // { sub, role, type } from JWT
        if (!user || user.role !== 'Root') {
            throw new ForbiddenException('Only the Root user can perform this action');
        }
        return { rootUserId: user.sub, rootUserName: 'Root Admin' };
    }

    // 1. Get all SuperAdmins
    @Get('users')
    async getAdmins(@Req() req: any) {
        this.extractRootUser(req); // Security check
        return this.superadminService.getAdmins();
    }

    // 2. Create a new SuperAdmin
    @Post('users')
    async createAdmin(@Req() req: any, @Body() data: any) {
        const { rootUserId, rootUserName } = this.extractRootUser(req);
        return this.superadminService.createAdmin(data, rootUserId, rootUserName);
    }

    // 3. Update an existing SuperAdmin
    @Patch('users/:id')
    async updateAdmin(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        const { rootUserId, rootUserName } = this.extractRootUser(req);
        return this.superadminService.updateAdmin(id, data, rootUserId, rootUserName);
    }

    // 4. Delete SuperAdmin
    @Delete('users/:id')
    async removeAdmin(@Req() req: any, @Param('id') id: string) {
        const { rootUserId, rootUserName } = this.extractRootUser(req);
        return this.superadminService.removeAdmin(id, rootUserId, rootUserName);
    }

    // 5. Get Audit Logs
    @Get('audit')
    async getAuditLogs(@Req() req: any) {
        this.extractRootUser(req); // Security check
        return this.superadminService.getAuditLogs();
    }

    // 6. Generic Log Action
    @Post('audit')
    async logAction(@Req() req: any, @Body() data: any) {
        const { rootUserId, rootUserName } = this.extractRootUser(req);
        return this.superadminService.logAction(rootUserId, rootUserName, data.action, data.targetId, data.details);
    }
}

