import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() createInvoiceDto: any) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const { sub, role, tenantId, type } = req.user || {};
    
    if (type === 'client') {
      return this.invoiceService.findAll(undefined, sub);
    }
    
    const filterTenantId = (role === 'Root' || role === 'SuperAdmin') ? undefined : tenantId;
    return this.invoiceService.findAll(filterTenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: any) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }
}
