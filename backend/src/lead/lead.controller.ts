import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { LeadService } from './lead.service';
import { Public } from '../auth/public.decorator';

@Controller('lead')
export class LeadController {
  constructor(private readonly service: LeadService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Public()
  @Post() create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id') update(@Param('id') id: string, @Body() data: any) { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
