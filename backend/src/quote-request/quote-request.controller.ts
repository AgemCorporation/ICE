import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

    @Public()
    @Get()
    findAll() {
        return this.quoteRequestService.findAll();
    }

    @Public()
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
