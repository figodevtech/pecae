const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pendingListings = await prisma.listing.findMany({
    where: { status: 'PENDING' },
    include: { vehicle: true, sellerProfile: { include: { user: true } } }
  });

  console.log(`--- PENDING LISTINGS ---`);
  for (const l of pendingListings) {
    console.log(`Seller: ${l.sellerProfile.user.email}`);
    console.log(`Listing ID: ${l.id}, Status: ${l.status}`);
    console.log(`Vehicle ID: ${l.vehicle?.id}, Status: ${l.vehicle?.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
