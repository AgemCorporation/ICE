import { Module } from '@nestjs/common';
import { LabourRateController } from './labour-rate.controller';
import { LabourRateService } from './labour-rate.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [LabourRateController], providers: [LabourRateService] })
export class LabourRateModule {}
