const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listing = await prisma.listing.findUnique({
    where: { id: "63093030-70d5-484a-9d8f-557925750bb3" },
    include: { vehicle: true }
  });
  
  if (listing.vehicleId) {
    await prisma.vehicle.update({
      where: { id: listing.vehicleId },
      data: { status: "ACTIVE" }
    });
    console.log("Updated vehicle to ACTIVE");
  }

  const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: listing.vehicleId } });
  console.log("Vehicle status:", updatedVehicle.status);
}

main().finally(() => prisma.$disconnect());
