const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const latestTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'desc' },
    where: { name: { not: "ICE Super Admin" } }
  });
  console.log('Latest Tenant:', latestTenant?.name, latestTenant?.adminEmail);
  
  const adminUser = await prisma.appUser.findFirst({
    where: { email: latestTenant?.adminEmail }
  });
  console.log('Admin User:', adminUser?.email, adminUser?.password);
  await prisma.$disconnect();
}
run();
