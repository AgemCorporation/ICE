import { Module } from '@nestjs/common';
import { CallCenterTicketService } from './call-center-ticket.service';
import { CallCenterTicketController } from './call-center-ticket.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CallCenterTicketController],
  providers: [CallCenterTicketService],
})
export class CallCenterTicketModule {}
