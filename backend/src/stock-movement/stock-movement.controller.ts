import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';

@Controller('stock-movement')
export class StockMovementController {
  constructor(private readonly service: StockMovementService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() data: any) { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: any) { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
