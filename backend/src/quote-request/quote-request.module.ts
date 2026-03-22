import { Module } from '@nestjs/common';
import { QuoteRequestService } from './quote-request.service';
import { QuoteRequestController } from './quote-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [QuoteRequestService],
  controllers: [QuoteRequestController],
})
export class QuoteRequestModule { }
