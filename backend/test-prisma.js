const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.quoteRequest.findMany({
    select: { id: true, status: true, description: true, motoristName: true, motoristPhone: true, acceptedQuoteId: true, proposedQuotes: true }
  });
  console.log(JSON.stringify(reqs, null, 2));
}
main().finally(() => prisma.$disconnect());
