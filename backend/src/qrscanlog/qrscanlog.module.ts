import { Module } from '@nestjs/common';
import { QrscanlogService } from './qrscanlog.service';
import { QrscanlogController } from './qrscanlog.controller';

@Module({
  controllers: [QrscanlogController],
  providers: [QrscanlogService],
})
export class QrscanlogModule {}
