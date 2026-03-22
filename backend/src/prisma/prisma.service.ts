import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        // For Prisma 7, we initialize the adapter with the connection string from env
        const connectionString = process.env.DATABASE_URL;
        let adapter: PrismaPg | undefined = undefined;

        if (connectionString) {
            const pool = new Pool({ connectionString });
            adapter = new PrismaPg(pool);
        }

        // Call the parent constructor securely
        super(adapter ? { adapter } : {});
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
