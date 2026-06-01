import {
  PrismaClient,
  UserType,
  UserStatus,
  SellerType,
  ListingStatus,
  VehicleStatus,
  FuelType,
  TransmissionType,
  PlanType,
  BudgetType,
  AdCampaignStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Testes E2E (PECAÊ)...');

  const passwordHash = await bcrypt.hash('Pecae@E2e123', 12);

  // 1. Criar Atores
  const usersData = [
    {
      id: crypto.randomUUID(),
      name: 'Comprador E2E',
      email: 'buyer-e2e@pecae.com.br',
      passwordHash,
      type: UserType.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Vendedor E2E',
      email: 'seller-e2e@pecae.com.br',
      passwordHash,
      type: UserType.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Vendedor Gratuito',
      email: 'seller-free@pecae.com.br',
      passwordHash,
      type: UserType.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Moderador E2E',
      email: 'moderator-e2e@pecae.com.br',
      passwordHash,
      type: UserType.MODERATOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Admin E2E',
      email: 'admin-e2e@pecae.com.br',
      passwordHash,
      type: UserType.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Comprador Malicioso',
      email: 'hacker@pecae.com.br',
      passwordHash,
      type: UserType.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'Novo Vendedor Sem Perfil',
      email: 'new-seller@pecae.com.br',
      passwordHash,
      type: UserType.SELLER,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash: userData.passwordHash,
        type: userData.type,
        status: userData.status,
        emailVerified: userData.emailVerified,
      },
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        passwordHash: userData.passwordHash,
        type: userData.type,
        status: userData.status,
        emailVerified: userData.emailVerified,
        emailVerifiedAt: userData.emailVerified ? new Date() : null,
      },
    });
    seededUsers[userData.email] = user;

    // Criar preferências de notificação padrão
    await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
      },
    });
  }
  console.log('✅ Atores de E2E criados.');

  // 2. Criar Perfis dos Vendedores
  const sellerE2E = seededUsers['seller-e2e@pecae.com.br'];
  const sellerFree = seededUsers['seller-free@pecae.com.br'];

  const profileE2E = await prisma.sellerProfile.upsert({
    where: { userId: sellerE2E.id },
    update: {
      isVerified: true,
      plan: PlanType.PRO,
    },
    create: {
      id: crypto.randomUUID(),
      userId: sellerE2E.id,
      storeName: 'Sucatão E2E Principal',
      type: SellerType.PJ,
      cnpj: '12.345.678/0001-99',
      address: 'Avenida dos Autopeças, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04578-000',
      whatsapp: '11988888888',
      isVerified: true,
      showWhatsapp: true,
      plan: PlanType.PRO,
    },
  });

  const profileFree = await prisma.sellerProfile.upsert({
    where: { userId: sellerFree.id },
    update: {
      isVerified: false,
      plan: PlanType.FREE,
    },
    create: {
      id: crypto.randomUUID(),
      userId: sellerFree.id,
      storeName: 'Desmanche Grátis E2E',
      type: SellerType.PF,
      address: 'Rua Sem Saída, 99',
      city: 'Guarulhos',
      state: 'SP',
      zipCode: '07000-000',
      whatsapp: '11977777777',
      isVerified: false,
      showWhatsapp: true,
      plan: PlanType.FREE,
    },
  });
  console.log('✅ Perfis de vendedores E2E criados.');

  // 3. Obter catálogo de veículos (marcas/modelos inseridos na seed principal)
  const models = await prisma.vehicleModel.findMany({ include: { brand: true } });
  if (models.length === 0) {
    throw new Error('❌ Catálogo de veículos está vazio. Rode o seed do catálogo primeiro.');
  }

  const modelUno = models.find((m) => m.name === 'Uno') || models[0];
  const modelGol = models.find((m) => m.name === 'Gol') || models[1 % models.length];
  const modelOnix = models.find((m) => m.name === 'Onix') || models[2 % models.length];

  const categories = await prisma.partCategory.findMany();
  const availablePartsIds = categories.slice(0, 5).map((c) => c.id);

  // Auxiliar para criar veículo, versão, ano, e fotos
  async function createVehicleHelper(
    sellerId: string,
    model: any,
    plate: string,
    color: string,
    listingTitle: string,
    listingStatus: ListingStatus,
    vehicleStatus: VehicleStatus = VehicleStatus.ACTIVE
  ) {
    const version = await prisma.vehicleVersion.create({
      data: {
        id: crypto.randomUUID(),
        modelId: model.id,
        name: '1.0 Flex E2E',
        fuel: FuelType.FLEX,
        transmission: TransmissionType.MANUAL,
        displacement: 1.0,
      },
    });

    const year = await prisma.vehicleYear.create({
      data: {
        id: crypto.randomUUID(),
        versionId: version.id,
        yearFab: 2020,
        yearModel: 2020,
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        id: crypto.randomUUID(),
        sellerId,
        versionId: version.id,
        yearFabId: year.id,
        color,
        plate,
        city: 'São Paulo',
        state: 'SP',
        availableParts: availablePartsIds,
        status: vehicleStatus,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
              order: 0,
            },
          ],
        },
        listings: {
          create: [
            {
              id: crypto.randomUUID(),
              sellerProfileId: sellerId,
              title: listingTitle,
              description: 'Este veículo de teste foi criado deterministicamente para a suíte E2E.',
              status: listingStatus,
              publishedAt: listingStatus === ListingStatus.PUBLISHED ? new Date() : null,
            },
          ],
        },
      },
      include: {
        listings: true,
      },
    });

    return vehicle;
  }

  // 4. Cadastrar 3 anúncios para o Vendedor Gratuito (atingir limite de cota)
  console.log('📦 Cadastrando 3 anúncios para o Vendedor Gratuito...');
  await createVehicleHelper(
    profileFree.id,
    modelUno,
    'E2E-0001',
    'Preto',
    'Uno Sucata E2E - Cota 1',
    ListingStatus.PUBLISHED
  );
  await createVehicleHelper(
    profileFree.id,
    modelUno,
    'E2E-0002',
    'Branco',
    'Uno Sucata E2E - Cota 2',
    ListingStatus.PUBLISHED
  );
  await createVehicleHelper(
    profileFree.id,
    modelUno,
    'E2E-0003',
    'Prata',
    'Uno Sucata E2E - Cota 3',
    ListingStatus.PUBLISHED
  );
  console.log('✅ Vendedor Gratuito atingiu a cota de 3 anúncios.');

  // 5. Criar Anúncios para o Vendedor E2E Principal
  console.log('📦 Criando anúncios para o Vendedor E2E Principal...');
  
  // Anúncio Pendente de aprovação (Fluxo 1)
  const pendingVehicle = await createVehicleHelper(
    profileE2E.id,
    modelGol,
    'E2E-7777',
    'Vermelho',
    'Gol Sucata E2E - Pendente de Moderação',
    ListingStatus.PENDING,
    VehicleStatus.PENDING
  );
  const pendingListing = pendingVehicle.listings[0];

  // Anúncio Publicado para Negociação/Chat (Fluxo 2)
  const publishedVehicle = await createVehicleHelper(
    profileE2E.id,
    modelOnix,
    'E2E-8888',
    'Cinza',
    'Onix Sucata E2E - Pronto para Negociar',
    ListingStatus.PUBLISHED,
    VehicleStatus.ACTIVE
  );
  const publishedListing = publishedVehicle.listings[0];
  console.log('✅ Anúncios (PENDING e PUBLISHED) do Vendedor E2E principal criados.');

  // 6. Criar Busca Salva (SavedSearch) para o Comprador E2E
  const buyerE2E = seededUsers['buyer-e2e@pecae.com.br'];
  
  await prisma.savedSearch.create({
    data: {
      id: crypto.randomUUID(),
      userId: buyerE2E.id,
      query: 'Gol',
      filters: {
        brandId: modelGol.brandId,
        modelId: modelGol.id,
      },
      alertActive: true,
    },
  });
  console.log('✅ Busca salva com alerta ativo criada para o Comprador E2E.');

  // 7. Criar ChatRoom pré-existente e mensagens para a avaliação (Fluxo 2)
  const chatRoom = await prisma.chatRoom.create({
    data: {
      id: crypto.randomUUID(),
      buyerId: buyerE2E.id,
      sellerId: sellerE2E.id,
      listingId: publishedListing.id,
      vehicleId: publishedVehicle.id,
      isActive: true,
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        roomId: chatRoom.id,
        senderId: buyerE2E.id,
        content: 'Olá! Você tem o câmbio desse Onix disponível?',
        createdAt: new Date(Date.now() - 3600000), // 1h atrás
      },
      {
        id: crypto.randomUUID(),
        roomId: chatRoom.id,
        senderId: sellerE2E.id,
        content: 'Olá, sim! O câmbio está em perfeitas condições, funcionando perfeitamente.',
        createdAt: new Date(Date.now() - 1800000), // 30m atrás
      },
    ],
  });
  console.log('✅ Sala de chat pré-existente e mensagens inseridas.');

  // 8. Criar AdCampaign ativa para anúncio patrocinado (Fluxo 4)
  await prisma.adCampaign.create({
    data: {
      id: crypto.randomUUID(),
      listingId: publishedListing.id,
      status: AdCampaignStatus.ACTIVE,
      budget: 100.00,
      spent: 0.00,
      impressions: 0,
      clicks: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // +30 dias
      budgetType: BudgetType.CPC,
      targetBrandId: modelOnix.brandId,
      targetModelId: modelOnix.id,
    },
  });

  // Atualiza o listing correspondente para refletir campanha patrocinada ativa
  await prisma.listing.update({
    where: { id: publishedListing.id },
    data: {
      isSponsoredActive: true,
    },
  });
  console.log('✅ Campanha de anúncio patrocinado ativa vinculada.');

  console.log('🎉 Seed de testes E2E do PECAÊ finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Falha ao rodar seed E2E:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
