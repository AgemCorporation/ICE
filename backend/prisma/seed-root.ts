import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@icebymecatech.ci';
    const password = 'admin';

    const owner = await prisma.appUser.findUnique({ where: { email } });

    if (owner) {
        console.log('User found. Updating to Root role...');
        await prisma.appUser.update({
            where: { email },
            data: { role: 'Root', password }
        });
    } else {
        console.log('User not found. Creating Root admin...');
        await prisma.appUser.create({
            data: {
                id: 'SUPER_ADMIN',
                email,
                firstName: 'Super',
                lastName: 'Admin',
                password,
                role: 'Root',
                active: true,
                superAdminPerms: []
            }
        });
    }
    console.log('Superadmin access created/updated successfully.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
