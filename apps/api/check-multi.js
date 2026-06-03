const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: { vehicleId: '0af3f46e-544f-4a58-8468-dd6b53c641f3' }
  });
  console.log(`Listings for vehicle 0af3f46e-544f-4a58-8468-dd6b53c641f3:`);
  for (const l of listings) {
    console.log(`Listing ID: ${l.id}, Status: ${l.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
