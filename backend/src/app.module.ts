import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt.guard';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { ClientModule } from './client/client.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PrismaModule } from './prisma/prisma.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { QuoteRequestModule } from './quote-request/quote-request.module';
import { SystemLogModule } from './system-log/system-log.module';
import { MotoristVehicleModule } from './motorist-vehicle/motorist-vehicle.module';
import { QrscanlogModule } from './qrscanlog/qrscanlog.module';
import { RepairModule } from './repair/repair.module';
import { PartModule } from './part/part.module';
import { SupplierModule } from './supplier/supplier.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { LabourRateModule } from './labour-rate/labour-rate.module';
import { ServicePackageModule } from './service-package/service-package.module';
import { StockMovementModule } from './stock-movement/stock-movement.module';
import { LeadModule } from './lead/lead.module';
import { GarageRoleModule } from './garage-role/garage-role.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [AuthModule, TenantModule, UserModule, ClientModule, VehicleModule, InvoiceModule, PrismaModule, SuperadminModule, QuoteRequestModule, SystemLogModule, MotoristVehicleModule, QrscanlogModule, RepairModule, PartModule, SupplierModule, WarehouseModule, LabourRateModule, ServicePackageModule, StockMovementModule, LeadModule, GarageRoleModule, PlatformConfigModule, NotificationsModule, EventsModule, PaymentsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
