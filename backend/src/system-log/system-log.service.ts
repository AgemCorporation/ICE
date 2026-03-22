import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemLogService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        if (!data.id) {
            const crypto = require('crypto');
            data.id = crypto.randomUUID();
        }
        return this.prisma.systemLog.create({ data });
    }

    async findAll() {
        return this.prisma.systemLog.findMany({
            orderBy: { date: 'desc' }
        });
    }

    async findOne(id: string) {
        const log = await this.prisma.systemLog.findUnique({ where: { id } });
        if (!log) throw new NotFoundException(`SystemLog with ID ${id} not found`);
        return log;
    }

    async remove(id: string) {
        return this.prisma.systemLog.delete({ where: { id } });
    }

    async removeAll() {
        return this.prisma.systemLog.deleteMany({});
    }
}
