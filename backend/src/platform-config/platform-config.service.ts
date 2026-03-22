import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformConfigService {
  constructor(private prisma: PrismaService) {}

  // --- Platform Config (singleton row id='singleton') ---
  async get() {
    const entry = await this.prisma.platformConfigEntry.findUnique({ where: { id: 'singleton' } });
    return entry?.data || {};
  }

  async upsert(data: any) {
    return this.prisma.platformConfigEntry.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', data },
      update: { data },
    });
  }

  // --- Global Announcement (singleton row id='announcement') ---
  async getAnnouncement() {
    const entry = await this.prisma.platformConfigEntry.findUnique({ where: { id: 'announcement' } });
    return entry?.data || null;
  }

  async setAnnouncement(data: any) {
    return this.prisma.platformConfigEntry.upsert({
      where: { id: 'announcement' },
      create: { id: 'announcement', data },
      update: { data },
    });
  }

  async dismissAnnouncement() {
    try {
      await this.prisma.platformConfigEntry.delete({ where: { id: 'announcement' } });
    } catch (e) {
      // Row may not exist, that's fine
    }
    return { success: true };
  }
}
