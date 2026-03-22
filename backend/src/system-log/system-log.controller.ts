import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { Public } from '../auth/public.decorator';

@Controller('system-log')
export class SystemLogController {
    constructor(private readonly systemLogService: SystemLogService) { }

    @Public()
    @Post()
    create(@Body() createSystemLogDto: any) {
        return this.systemLogService.create(createSystemLogDto);
    }

    @Get()
    findAll() {
        return this.systemLogService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.systemLogService.findOne(id);
    }

    @Delete('all')
    removeAll() {
        return this.systemLogService.removeAll();
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.systemLogService.remove(id);
    }
}
