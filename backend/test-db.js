const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.quoteRequest.findMany({
    select: { id: true, status: true, motoristName: true, motoristPhone: true, description: true }
  });
  console.log(JSON.stringify(reqs, null, 2));
}
main().finally(() => prisma.$disconnect());
