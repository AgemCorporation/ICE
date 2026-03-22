import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.garageRole.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('Total Roles in DB:', roles.length);
  roles.forEach(r => console.log(`Tenant: ${r.tenantId || 'GLOBAL'} | Role: ${r.name} | Perms: ${r.permissions.length}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
