const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sellerUser = await prisma.user.findUnique({
    where: { email: 'vendedor@pecae.com.br' },
    include: { sellerProfile: true }
  });

  if (!sellerUser) {
    console.log('Seller not found');
    return;
  }

  const sellerProfileId = sellerUser.sellerProfile.id;
  const vehicles = await prisma.vehicle.findMany({
    where: { sellerId: sellerProfileId },
    include: { listings: true, photos: true }
  });

  console.log('--- Vehicles for Vendedor ---');
  for (const v of vehicles) {
    console.log(`Vehicle ID: ${v.id}`);
    console.log(`Vehicle Status: ${v.status}`);
    console.log(`Listings:`, v.listings.map(l => ({ id: l.id, status: l.status })));
    console.log(`Photos:`, v.photos.length);
    console.log('---------------------------');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
