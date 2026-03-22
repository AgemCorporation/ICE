import { Controller, Get, Put, Delete, Body } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';

@Controller('platform-config')
export class PlatformConfigController {
  constructor(private readonly service: PlatformConfigService) {}

  @Get()
  get() { return this.service.get(); }

  @Put()
  upsert(@Body() data: any) { return this.service.upsert(data); }

  // --- Global Announcement ---
  @Get('announcement')
  getAnnouncement() { return this.service.getAnnouncement(); }

  @Put('announcement')
  setAnnouncement(@Body() data: any) { return this.service.setAnnouncement(data); }

  @Delete('announcement')
  dismissAnnouncement() { return this.service.dismissAnnouncement(); }
}
