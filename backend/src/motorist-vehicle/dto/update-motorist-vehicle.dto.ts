import { PartialType } from '@nestjs/mapped-types';
import { CreateMotoristVehicleDto } from './create-motorist-vehicle.dto';

export class UpdateMotoristVehicleDto extends PartialType(CreateMotoristVehicleDto) {}
