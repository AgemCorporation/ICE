import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * POST /api/auth/login — Staff email/password login
     */
    @Public()
    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    /**
     * POST /api/auth/pin-login — Workshop PIN login for mechanics
     */
    @Public()
    @Post('pin-login')
    async pinLogin(@Body() body: { userId: string; pin: string }) {
        return this.authService.pinLogin(body.userId, body.pin);
    }

    /**
     * GET /api/auth/profile — Validate session and return current user profile
     * Protected — requires valid JWT
     */
    @Get('profile')
    async getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.sub);
    }

    /**
     * GET /api/auth/workshop-staff — Get limited staff list for Workshop Mode picker
     * Public — no auth required (used on login screen)
     */
    @Public()
    @Get('workshop-staff')
    async getWorkshopStaff() {
        return this.authService.getWorkshopStaff();
    }
}
