import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    /**
     * Staff login via email + password.
     * Supports both legacy plaintext and bcrypt-hashed passwords.
     */
    async login(email: string, password: string) {
        const user = await this.prisma.appUser.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        if (!user.active) {
            throw new UnauthorizedException('Compte désactivé');
        }

        // Validate password — block login if none is set
        if (!user.password) {
            throw new UnauthorizedException('Mot de passe non configuré. Contactez votre administrateur.');
        }

        const bcrypt = await import('bcrypt');
        const isBcrypt = user.password.startsWith('$2');

        if (isBcrypt) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) throw new UnauthorizedException('Mot de passe incorrect');
        } else {
            // Legacy plaintext comparison
            if (user.password !== password) {
                throw new UnauthorizedException('Mot de passe incorrect');
            }
        }

        const payload = { sub: user.id, role: user.role, tenantId: user.tenantId || null, type: 'staff' };
        const token = await this.jwtService.signAsync(payload);
        // Return user without sensitive fields
        const { password: _, pinCode: __, ...safeUser } = user;
        return { user: safeUser, token };
    }

    /**
     * Workshop PIN login for mechanics.
     */
    async pinLogin(userId: string, pin: string) {
        const user = await this.prisma.appUser.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (!user.active) {
            throw new UnauthorizedException('Compte désactivé');
        }

        if (!user.pinCode) {
            throw new UnauthorizedException('Aucun code PIN configuré pour cet utilisateur');
        }

        if (user.pinCode !== pin) {
            throw new UnauthorizedException('Code PIN incorrect');
        }

        const payload = { sub: user.id, role: user.role, tenantId: user.tenantId || null, type: 'staff' };
        const token = await this.jwtService.signAsync(payload);

        const { password: _, pinCode: __, ...safeUser } = user;
        return { user: safeUser, token };
    }

    /**
     * Get user profile from JWT token (session validation).
     */
    async getProfile(userId: string) {
        const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        const { password: _, pinCode: __, ...safeUser } = user;
        return safeUser;
    }

    /**
     * Get limited staff list for Workshop Mode (public endpoint).
     * Returns only the fields needed for the mechanic picker UI.
     */
    async getWorkshopStaff() {
        return this.prisma.appUser.findMany({
            where: { active: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                active: true,
                tenantId: true,
            },
        });
    }
}
