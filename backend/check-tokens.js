const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({ 
    select: { phone: true, pushToken: true },
    where: { pushToken: { not: null } }
  });
  console.log("Clients with push tokens:", clients);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
