import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { Prisma } from '@prisma/client';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @Post()
  create(@Body() createVehicleDto: Prisma.VehicleCreateInput) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get('decode-vin/:vin')
  async decodeVin(@Param('vin') vin: string) {
    try {
      const response = await fetch(`https://auto.dev/api/vin/${vin.trim()}`, {
        headers: {
          'Authorization': 'Bearer sk_ad_pau1ko0A9z55cxBFx7vZAmRK'
        }
      });
      return await response.json();
    } catch (e: any) {
      return { errorType: 'Internal Proxy Error', message: e.message || 'Erreur interne' };
    }
  }

  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: Prisma.VehicleUpdateInput) {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }
}
