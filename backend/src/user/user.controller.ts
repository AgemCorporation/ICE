import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from '../auth/public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Public()
  @Get('public/mechanics/:tenantId')
  publicMechanics(@Param('tenantId') tenantId: string) {
    return this.userService.findPublicMechanics(tenantId);
  }

  @Post()
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto, true);
  }

  @Get()
  findAll(@Req() req: any) {
    const { role, tenantId } = req.user || {};
    const filterTenantId = (role === 'Root' || role === 'SuperAdmin') ? undefined : tenantId;
    return this.userService.findAll(filterTenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.userService.update(id, updateUserDto, true);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
