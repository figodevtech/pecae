const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pendingListings = await prisma.listing.findMany({
    where: { status: 'PENDING' },
    include: { vehicle: true }
  });

  console.log(`--- PENDING LISTINGS (${pendingListings.length}) ---`);
  for (const l of pendingListings) {
    console.log(`Listing ID: ${l.id}, Vehicle Status: ${l.vehicle?.status}`);
  }

  const pendingVehicles = await prisma.vehicle.findMany({
    where: { status: 'PENDING' }
  });
  console.log(`--- PENDING VEHICLES (${pendingVehicles.length}) ---`);
  for (const v of pendingVehicles) {
    console.log(`Vehicle ID: ${v.id}, Status: ${v.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
