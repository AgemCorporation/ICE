const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: "postgresql://postgres:Mecatech@localhost:5432/ice_db?schema=public" });
async function main() {
  await prisma.quoteRequest.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.repairOrder.deleteMany({});
  
  console.log("Database cleared successfully -> All corrupted orphaned requests removed.");
}
main().finally(() => prisma.$disconnect());
