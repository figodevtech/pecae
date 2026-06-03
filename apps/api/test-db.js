const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({ include: { vehicle: true } });
  console.log(JSON.stringify(listings, null, 2));
}

main().finally(() => prisma.$disconnect());
