const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.vehicle.findUnique({
    where: { id: '98f53340-0d3d-4f44-ba75-a9e8350acd6c' },
    include: { photos: true, listings: true }
  });

  console.log(`Vehicle ID: ${v.id}, Status: ${v.status}`);
  console.log(`Photos: ${v.photos.length}`);
  for (const p of v.photos) {
    console.log(` - Photo ${p.order}: ${p.url}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
