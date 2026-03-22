import { Module } from '@nestjs/common';
import { GarageRoleController } from './garage-role.controller';
import { GarageRoleService } from './garage-role.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [GarageRoleController], providers: [GarageRoleService] })
export class GarageRoleModule {}
