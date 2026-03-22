import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MotoristVehicleService } from './motorist-vehicle.service';
import { Public } from '../auth/public.decorator';

@Controller('motorist-vehicle')
export class MotoristVehicleController {
  constructor(private readonly motoristVehicleService: MotoristVehicleService) {}

  @Public()
  @Post()
  create(@Body() createMotoristVehicleDto: any) {
    return this.motoristVehicleService.create(createMotoristVehicleDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.motoristVehicleService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.motoristVehicleService.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMotoristVehicleDto: any) {
    return this.motoristVehicleService.update(id, updateMotoristVehicleDto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.motoristVehicleService.remove(id);
  }
}
