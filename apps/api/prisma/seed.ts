import {
  PrismaClient,
  UserType,
  UserStatus,
  VehicleSegment,
  SellerType,
  ListingStatus,
  VehicleStatus,
  FuelType,
  TransmissionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================
// VEHICLE CATALOG DATA — Top 10 BR Brands (M04-T01-ST03)
// ============================================================
const VEHICLE_CATALOG = [
  {
    name: 'Fiat',
    country: 'Italy',
    models: [
      { name: 'Uno', segment: VehicleSegment.HATCH },
      { name: 'Palio', segment: VehicleSegment.HATCH },
      { name: 'Strada', segment: VehicleSegment.PICKUP },
      { name: 'Toro', segment: VehicleSegment.PICKUP },
      { name: 'Mobi', segment: VehicleSegment.HATCH },
    ],
  },
  {
    name: 'Volkswagen',
    country: 'Germany',
    models: [
      { name: 'Gol', segment: VehicleSegment.HATCH },
      { name: 'Polo', segment: VehicleSegment.HATCH },
      { name: 'Saveiro', segment: VehicleSegment.PICKUP },
      { name: 'T-Cross', segment: VehicleSegment.SUV },
      { name: 'Voyage', segment: VehicleSegment.SEDAN },
    ],
  },
  {
    name: 'Chevrolet',
    country: 'USA',
    models: [
      { name: 'Onix', segment: VehicleSegment.HATCH },
      { name: 'Tracker', segment: VehicleSegment.SUV },
      { name: 'S10', segment: VehicleSegment.PICKUP },
      { name: 'Prisma', segment: VehicleSegment.SEDAN },
      { name: 'Spin', segment: VehicleSegment.VAN },
    ],
  },
  {
    name: 'Toyota',
    country: 'Japan',
    models: [
      { name: 'Corolla', segment: VehicleSegment.SEDAN },
      { name: 'Hilux', segment: VehicleSegment.PICKUP },
      { name: 'Etios', segment: VehicleSegment.HATCH },
      { name: 'Yaris', segment: VehicleSegment.HATCH },
      { name: 'SW4', segment: VehicleSegment.SUV },
    ],
  },
  {
    name: 'Hyundai',
    country: 'South Korea',
    models: [
      { name: 'HB20', segment: VehicleSegment.HATCH },
      { name: 'Creta', segment: VehicleSegment.SUV },
      { name: 'HB20S', segment: VehicleSegment.SEDAN },
      { name: 'Tucson', segment: VehicleSegment.SUV },
      { name: 'Santa Fe', segment: VehicleSegment.SUV },
    ],
  },
  {
    name: 'Jeep',
    country: 'USA',
    models: [
      { name: 'Renegade', segment: VehicleSegment.SUV },
      { name: 'Compass', segment: VehicleSegment.SUV },
      { name: 'Commander', segment: VehicleSegment.SUV },
      { name: 'Grand Cherokee', segment: VehicleSegment.SUV },
      { name: 'Wrangler', segment: VehicleSegment.SUV },
    ],
  },
  {
    name: 'Renault',
    country: 'France',
    models: [
      { name: 'Kwid', segment: VehicleSegment.HATCH },
      { name: 'Sandero', segment: VehicleSegment.HATCH },
      { name: 'Logan', segment: VehicleSegment.SEDAN },
      { name: 'Duster', segment: VehicleSegment.SUV },
      { name: 'Oroch', segment: VehicleSegment.PICKUP },
    ],
  },
  {
    name: 'Honda',
    country: 'Japan',
    models: [
      { name: 'Civic', segment: VehicleSegment.SEDAN },
      { name: 'HR-V', segment: VehicleSegment.SUV },
      { name: 'Fit', segment: VehicleSegment.HATCH },
      { name: 'City', segment: VehicleSegment.SEDAN },
      { name: 'WR-V', segment: VehicleSegment.SUV },
    ],
  },
  {
    name: 'Nissan',
    country: 'Japan',
    models: [
      { name: 'Kicks', segment: VehicleSegment.SUV },
      { name: 'Versa', segment: VehicleSegment.SEDAN },
      { name: 'Frontier', segment: VehicleSegment.PICKUP },
      { name: 'Sentra', segment: VehicleSegment.SEDAN },
      { name: 'March', segment: VehicleSegment.HATCH },
    ],
  },
  {
    name: 'Ford',
    country: 'USA',
    models: [
      { name: 'Ka', segment: VehicleSegment.HATCH },
      { name: 'EcoSport', segment: VehicleSegment.SUV },
      { name: 'Ranger', segment: VehicleSegment.PICKUP },
      { name: 'Fiesta', segment: VehicleSegment.HATCH },
      { name: 'Focus', segment: VehicleSegment.HATCH },
    ],
  },
];
const PART_CATEGORIES = [
  { name: 'Motor', slug: 'motor', icon: 'engine' },
  { name: 'Câmbio', slug: 'cambio', icon: 'gearbox' },
  { name: 'Suspensão Dianteira', slug: 'suspensao-dianteira', icon: 'suspension-front' },
  { name: 'Suspensão Traseira', slug: 'suspensao-traseira', icon: 'suspension-rear' },
  { name: 'Freios', slug: 'freios', icon: 'brake' },
  { name: 'Lataria', slug: 'lataria', icon: 'body' },
  { name: 'Vidros', slug: 'vidros', icon: 'glass' },
  { name: 'Bancos e Estofamento', slug: 'bancos-estofamento', icon: 'seat' },
  { name: 'Painel e Elétrica', slug: 'painel-eletrica', icon: 'dashboard' },
  { name: 'Rodas e Pneus', slug: 'rodas-pneus', icon: 'wheel' },
  { name: 'Direção', slug: 'direcao', icon: 'steering' },
  { name: 'Arrefecimento', slug: 'arrefecimento', icon: 'cooling' },
  { name: 'Ar-Condicionado', slug: 'ar-condicionado', icon: 'ac' },
  { name: 'Escapamento', slug: 'escapamento', icon: 'exhaust' },
  { name: 'Capô e Para-choque', slug: 'capo-para-choque', icon: 'hood' },
  { name: 'Iluminação', slug: 'iluminacao', icon: 'light' },
];

const PART_CATALOG_DATA = [
  { categorySlug: 'motor', parts: ['Cabeçote', 'Bloco', 'Biela', 'Pistão', 'Virabrequim', 'Carter', 'Tampa de Válvulas', 'Coletor de Admissão', 'Coletor de Escape'] },
  { categorySlug: 'cambio', parts: ['Eixo Primário', 'Eixo Secundário', 'Engrenagem 1ª Marcha', 'Sincronizador', 'Trambulador', 'Conversor de Torque', 'Capa Seca'] },
  { categorySlug: 'suspensao-dianteira', parts: ['Amortecedor', 'Mola', 'Balança/Bandeja', 'Pivô', 'Barra Estabilizadora', 'Terminal de Direção', 'Cubo de Roda'] },
  { categorySlug: 'lataria', parts: ['Porta Dianteira Esquerda', 'Porta Dianteira Direita', 'Porta Traseira Esquerda', 'Porta Traseira Direita', 'Tampa do Porta-Malas', 'Teto', 'Paralama Esquerdo', 'Paralama Direito'] },
  { categorySlug: 'vidros', parts: ['Parabrisa', 'Vidro Traseiro', 'Vidro Porta Dianteira', 'Vidro Porta Traseira', 'Janela Lateral'] },
  { categorySlug: 'iluminacao', parts: ['Farol Esquerdo', 'Farol Direito', 'Lanterna Traseira Esquerda', 'Lanterna Traseira Direita', 'Pisca-Pisca', 'Luz de Freio'] },
];

async function seedVehicleCatalog() {
  for (const brandData of VEHICLE_CATALOG) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { name: brandData.name },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: brandData.name,
        country: brandData.country,
      },
    });

    for (const modelData of brandData.models) {
      await prisma.vehicleModel.upsert({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: modelData.name,
          },
        },
        update: {},
        create: {
          id: crypto.randomUUID(),
          brandId: brand.id,
          name: modelData.name,
          segment: modelData.segment,
        },
      });
    }
  }
  console.log(`✅ ${VEHICLE_CATALOG.length} vehicle brands and their models seeded.`);
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@pecae.com.br';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminPassword) {
    console.warn(
      '⚠️  ADMIN_SEED_PASSWORD not set — skipping admin user seed.',
    );
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      type: UserType.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: crypto.randomUUID(),
      name: 'Admin PECAÊ',
      email: adminEmail,
      passwordHash,
      type: UserType.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerified: false,
    },
  });

  console.log(`✅ Admin user seeded: ${adminEmail}`);
}

async function seedPartCategories() {
  for (const category of PART_CATEGORIES) {
    await prisma.partCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: category.name,
        slug: category.slug,
        icon: category.icon,
      },
    });
  }
  console.log(`✅ ${PART_CATEGORIES.length} part categories seeded.`);
}

async function seedPartCatalog() {
  for (const data of PART_CATALOG_DATA) {
    const category = await prisma.partCategory.findUnique({
      where: { slug: data.categorySlug },
    });

    if (!category) continue;

    for (const partName of data.parts) {
      const slug = `${data.categorySlug}-${partName.toLowerCase().replace(/ /g, '-')}`;
      await prisma.partCatalog.upsert({
        where: { slug },
        update: {},
        create: {
          id: crypto.randomUUID(),
          categoryId: category.id,
          name: partName,
          slug,
        },
      });
    }
  }
  console.log('✅ Part catalog seeded with sub-parts.');
}

async function seedTestVehicles() {
  console.log('📦 Seeding Test Vehicles...');
  
  const passwordHash = await bcrypt.hash('Pecae@123', 12);

  // 1. Create Buyer User
  await prisma.user.upsert({
    where: { email: 'comprador@pecae.com.br' },
    update: {
      type: UserType.BUYER,
      passwordHash,
    },
    create: {
      id: crypto.randomUUID(),
      name: 'Comprador de Teste',
      email: 'comprador@pecae.com.br',
      passwordHash,
      type: UserType.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
    },
  });
  console.log('✅ Buyer test user seeded: comprador@pecae.com.br');

  // 2. Create Seller User
  const sellerUser = await prisma.user.upsert({
    where: { email: 'vendedor@pecae.com.br' },
    update: {
      type: UserType.SELLER,
      passwordHash,
    },
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

  // 3. Check if vehicles already exist
  const existingVehiclesCount = await prisma.vehicle.count();
  if (existingVehiclesCount > 0) {
    console.log(`ℹ️ ${existingVehiclesCount} vehicles already exist. Skipping vehicle seed.`);
    return;
  }

  // 4. Get Catalog Data
  const models = await prisma.vehicleModel.findMany({ include: { brand: true } });
  if (models.length === 0) {
    console.warn('⚠️ No models found. Cannot seed vehicles.');
    return;
  }

  const categories = await prisma.partCategory.findMany();

  // URLs de fotos reais de carros do Unsplash
  const carImages = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', // Chevy
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80', // Ford
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80', // Audi
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', // Porsche
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80', // Supercar
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80', // Ferrari
    'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=800&q=80', // Classic
  ];

  console.log('🚀 Creating Vehicles and Listings...');
  
  // Criar 5 veículos de teste
  for (let i = 0; i < 5; i++) {
    const model = models[i % models.length];
    
    // Create version
    const version = await prisma.vehicleVersion.create({
      data: {
        id: crypto.randomUUID(),
        modelId: model.id,
        name: ['1.0 Flex Manual', '1.6 MSI Automático', '2.0 Turbo AWD', '1.3 Turbo Flex'][i % 4],
        fuel: [FuelType.FLEX, FuelType.GASOLINE, FuelType.ETHANOL][i % 3],
        transmission: [TransmissionType.MANUAL, TransmissionType.AUTOMATIC][i % 2],
        displacement: [1.0, 1.6, 2.0, 1.3][i % 4],
      },
    });

    // Create year
    const year = await prisma.vehicleYear.create({
      data: {
        id: crypto.randomUUID(),
        versionId: version.id,
        yearFab: 2018 + i,
        yearModel: 2019 + i,
      },
    });

    // Create Vehicle
    await prisma.vehicle.create({
      data: {
        sellerId: sellerProfile.id,
        versionId: version.id,
        yearFabId: year.id,
        color: ['Prata', 'Preto', 'Branco', 'Vermelho', 'Azul'][i % 5],
        plate: `ABC-${1000 + i}`,
        status: VehicleStatus.ACTIVE,
        city: 'São Paulo',
        state: 'SP',
        availableParts: categories.slice(0, 3 + i).map(c => c.id),
        photos: {
          create: [
            { url: carImages[i % carImages.length], order: 0 },
            { url: carImages[(i + 1) % carImages.length], order: 1 },
          ],
        },
        listings: {
          create: [{
            sellerProfileId: sellerProfile.id,
            title: `${model.brand.name} ${model.name} - Estado de Novo`,
            description: `Veículo em ótimo estado para retirada de peças. Pouco rodado.`,
            status: ListingStatus.PUBLISHED,
            publishedAt: new Date(),
          }],
        },
      },
    });
  }

  console.log('✅ 5 Test vehicles and listings seeded.');
}

async function main() {
  console.log('🌱 Starting PECAÊ database seed...');

  await seedPartCategories();
  await seedPartCatalog();
  await seedAdminUser();
  await seedVehicleCatalog();
  await seedTestVehicles();

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
