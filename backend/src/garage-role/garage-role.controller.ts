import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { GarageRoleService } from './garage-role.service';
import { Public } from '../auth/public.decorator';

@Controller('garage-role')
export class GarageRoleController {
  constructor(private readonly service: GarageRoleService) {}

  @Public()
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() data: any) { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: any) { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
