import {
  PrismaClient,
  UserType,
  UserStatus,
  SellerType,
  ListingStatus,
  FuelType,
  TransmissionType,
  VehicleStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Test Data Seed (M05 Test Suite)...');

  const passwordHash = await bcrypt.hash('Pecae@123', 12);

  // 1. Create Seller User
  console.log('👤 Creating Seller...');
  const sellerUser = await prisma.user.upsert({
    where: { email: 'vendedor@pecae.com.br' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Vendedor de Teste',
      email: 'vendedor@pecae.com.br',
      passwordHash,
      type: UserType.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      userId: sellerUser.id,
      storeName: 'Sucatão do Italo',
      type: SellerType.PF,
      address: 'Rua das Sucatas, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001-000',
      whatsapp: '11999999999',
      isVerified: true,
      showWhatsapp: true,
    },
  });

  // 2. Create Buyer User
  console.log('👤 Creating Buyer...');
  await prisma.user.upsert({
    where: { email: 'comprador@pecae.com.br' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Comprador de Teste',
      email: 'comprador@pecae.com.br',
      passwordHash,
      type: UserType.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // 3. Ensure we have some base catalog data
  console.log('🚗 Checking Catalog Data...');
  let models = await prisma.vehicleModel.findMany({ include: { brand: true } });
  
  if (models.length === 0) {
    console.log('⚠️ Catalog empty. Please run the main seed first or check DB.');
    return;
  }

  // Ensure at least one version and year exists for testing
  const firstModel = models[0];
  const version = await prisma.vehicleVersion.upsert({
    where: { id: crypto.randomUUID() }, // Not really unique but for seed it works if we use create
    update: {},
    create: {
      id: crypto.randomUUID(),
      modelId: firstModel.id,
      name: '1.0 Flex Manual',
      fuel: FuelType.FLEX,
      transmission: TransmissionType.MANUAL,
      displacement: 1.0,
    },
  });

  const year = await prisma.vehicleYear.create({
    data: {
      versionId: version.id,
      yearFab: 2020,
      yearModel: 2021,
    },
  });

  const categories = await prisma.partCategory.findMany();

  // 4. Create 10 Vehicles
  console.log('📦 Creating 10 Vehicles...');
  const statuses = [
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PUBLISHED,
    ListingStatus.PENDING,
    ListingStatus.PENDING,
    ListingStatus.SOLD,
  ];

  for (let i = 0; i < 10; i++) {
    const status = statuses[i];
    const vehicleStatus = status === ListingStatus.SOLD ? VehicleStatus.SOLD : VehicleStatus.ACTIVE;
    
    const vehicle = await prisma.vehicle.create({
      data: {
        sellerId: sellerProfile.id,
        versionId: version.id,
        yearFabId: year.id,
        color: ['Prata', 'Preto', 'Branco', 'Vermelho', 'Azul'][i % 5],
        plate: `ABC-${1234 + i}`,
        status: vehicleStatus === VehicleStatus.SOLD ? VehicleStatus.SOLD : VehicleStatus.ACTIVE,
        city: 'São Paulo',
        state: 'SP',
        // availableParts as Json array of IDs
        availableParts: categories.slice(0, 5 + (i % 5)).map(c => c.id),
        photos: {
          create: [
            { url: `https://loremflickr.com/800/600/car,scrap/all?lock=${i}1`, order: 0 },
            { url: `https://loremflickr.com/800/600/car,scrap/all?lock=${i}2`, order: 1 },
            { url: `https://loremflickr.com/800/600/car,scrap/all?lock=${i}3`, order: 2 },
            { url: `https://loremflickr.com/800/600/car,scrap/all?lock=${i}4`, order: 3 },
          ]
        },
        listings: {
          create: [{
            sellerProfileId: sellerProfile.id,
            title: `${firstModel.brand.name} ${firstModel.name} ${version.name} - Teste ${i + 1}`,
            description: `Veículo de teste número ${i + 1} para validação do sistema PECAÊ.`,
            status: status,
            publishedAt: status === ListingStatus.PUBLISHED ? new Date() : null,
            soldAt: status === ListingStatus.SOLD ? new Date() : null,
          }]
        }
      }
    });
    console.log(`   ✅ Vehicle ${i + 1} created (${status})`);
  }

  console.log('🎉 Test data seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
