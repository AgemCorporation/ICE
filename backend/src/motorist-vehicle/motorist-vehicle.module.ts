import { Module } from '@nestjs/common';
import { MotoristVehicleService } from './motorist-vehicle.service';
import { MotoristVehicleController } from './motorist-vehicle.controller';

@Module({
  controllers: [MotoristVehicleController],
  providers: [MotoristVehicleService],
})
export class MotoristVehicleModule {}
