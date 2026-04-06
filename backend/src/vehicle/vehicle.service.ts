import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) { }

  private mapToPrisma(vehicle: any): Prisma.VehicleCreateInput {
    const { tenant, owner, invoices, repairs, ...rest } = vehicle;
    return {
      ...rest,
      firstRegistrationDate: vehicle.firstRegistrationDate ? new Date(vehicle.firstRegistrationDate) : null,
      lastTechnicalControl: vehicle.lastTechnicalControl ? new Date(vehicle.lastTechnicalControl) : null,
      history: vehicle.history || [],
    } as Prisma.VehicleCreateInput;
  }

  private mapToFront(vehicle: any) {
    if (!vehicle) return null;
    return {
      ...vehicle,
      history: vehicle.history || []
    };
  }

  async create(data: any) {
    try {
      const prismaData = this.mapToPrisma(data);
      const { id: _id, ...updateData } = prismaData as any;
      
      // 1. Find existing vehicle by ID, VIN, or Plate
      let existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          OR: [
            data.id ? { id: data.id } : {},
            (data.vin && data.vin !== '') ? { vin: data.vin } : {},
            (data.plate && data.plate !== '') ? { plate: data.plate } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      });

      let vehicle;
      if (existingVehicle) {
        vehicle = await this.prisma.vehicle.update({
          where: { id: existingVehicle.id },
          data: updateData,
        });
      } else {
        vehicle = await this.prisma.vehicle.create({
          data: prismaData,
        });
      }

      // 2. Sync the owner client's vehicleIds array to include this vehicle
      if (vehicle.ownerId) {
        try {
          const ownerClient = await this.prisma.client.findUnique({ where: { id: vehicle.ownerId } });
          if (ownerClient && !ownerClient.vehicleIds.includes(vehicle.id)) {
            await this.prisma.client.update({
              where: { id: vehicle.ownerId },
              data: { vehicleIds: { push: vehicle.id } },
            });
          }
        } catch (syncErr) {
          // Non-critical: log but don't fail the vehicle creation
          console.warn('Could not sync vehicleIds on client:', syncErr);
        }
      }

      return this.mapToFront(vehicle);
    } catch (e: any) {
      require('fs').appendFileSync('/tmp/backend-error.log', `Vehicle upsert error: ${e.message}\n${e.stack}\nData: ${JSON.stringify(data)}\n`);
      throw e;
    }
  }

  async findAll(tenantId?: string, ownerId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (ownerId) where.ownerId = ownerId;
    
    const vehicles = await this.prisma.vehicle.findMany({
      where,
    });
    return vehicles.map(v => this.mapToFront(v));
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    return this.mapToFront(vehicle);
  }

  async update(id: string, data: any) {
    const prismaData = this.mapToPrisma(data);
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: prismaData,
    });
    return this.mapToFront(vehicle);
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.delete({ where: { id } });
    return this.mapToFront(vehicle);
  }
}
