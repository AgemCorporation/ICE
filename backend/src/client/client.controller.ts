import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { Prisma } from '@prisma/client';
import { Public } from '../auth/public.decorator';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) { }

  @Post()
  create(@Body() createClientDto: Prisma.ClientCreateInput) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: Prisma.ClientUpdateInput) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }

  // ==== MOBILE AUTH ENDPOINTS ====

  @Public()
  @Post('mobile/register')
  mobileRegister(@Body() data: any) {
    return this.clientService.mobileRegister(data);
  }

  @Public()
  @Post('mobile/login')
  mobileLogin(@Body() credentials: any) {
    return this.clientService.mobileLogin(credentials);
  }

  @Public()
  @Patch('mobile/push-token')
  updatePushToken(@Body() data: { phone: string; pushToken: string }) {
    return this.clientService.updatePushToken(data.phone, data.pushToken);
  }

  @Public()
  @Post('mobile/forgot-password')
  forgotPassword(@Body() data: { email: string }) {
    return this.clientService.forgotPassword(data.email);
  }

  @Patch('mobile/change-password')
  changePassword(@Body() data: { clientId: string; oldPassword: string; newPassword: string }) {
    return this.clientService.changePassword(data.clientId, data.oldPassword, data.newPassword);
  }

  @Patch('mobile/avatar')
  updateAvatar(@Body() data: { clientId: string; base64: string }) {
    return this.clientService.updateAvatar(data.clientId, data.base64);
  }
}

