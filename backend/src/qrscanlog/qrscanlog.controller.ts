import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QrscanlogService } from './qrscanlog.service';

@Controller('qrscanlog')
export class QrscanlogController {
  constructor(private readonly qrscanlogService: QrscanlogService) {}

  @Post()
  create(@Body() createQrscanlogDto: any) {
    return this.qrscanlogService.create(createQrscanlogDto);
  }

  @Get()
  findAll() {
    return this.qrscanlogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qrscanlogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQrscanlogDto: any) {
    return this.qrscanlogService.update(id, updateQrscanlogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qrscanlogService.remove(id);
  }
}
