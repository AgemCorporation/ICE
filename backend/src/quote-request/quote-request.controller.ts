import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { QuoteRequestService } from './quote-request.service';
import { Public } from '../auth/public.decorator';

@Controller('quote-request')
export class QuoteRequestController {
    constructor(private readonly quoteRequestService: QuoteRequestService) { }

    @Public()
    @Post()
    create(@Body() createQuoteRequestDto: any) {
        return this.quoteRequestService.create(createQuoteRequestDto);
    }

    @Get()
    findAll(@Req() req: any) {
        const { sub, role, tenantId, type } = req.user || {};
        const filter: any = {};
        
        if (type === 'client') {
            filter.clientId = sub;
        } else if (role !== 'Root' && role !== 'SuperAdmin') {
            filter.tenantId = tenantId;
        }
        
        return this.quoteRequestService.findAll(filter);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.quoteRequestService.findOne(id);
    }

    @Public()
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateQuoteRequestDto: any) {
        return this.quoteRequestService.update(id, updateQuoteRequestDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.quoteRequestService.remove(id);
    }
}
