import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { RepairService } from './repair.service';

@Controller('repair')
export class RepairController {
  constructor(private readonly service: RepairService) {}

  @Get()
  findAll(@Req() req: any) {
    const { role, tenantId } = req.user || {};
    const filterTenantId = (role === 'Root' || role === 'SuperAdmin') ? undefined : tenantId;
    return this.service.findAll(filterTenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
