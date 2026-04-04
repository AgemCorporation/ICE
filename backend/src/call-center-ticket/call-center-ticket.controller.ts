import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CallCenterTicketService } from './call-center-ticket.service';
import { Prisma } from '@prisma/client';

@Controller('call-center-ticket')
export class CallCenterTicketController {
  constructor(private readonly service: CallCenterTicketService) {}

  @Post()
  create(@Body() data: Prisma.CallCenterTicketCreateInput) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.CallCenterTicketUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
