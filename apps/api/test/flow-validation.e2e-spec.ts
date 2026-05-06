import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VehiclesService } from '../src/vehicles/vehicles.service';
import { MatchProcessor } from '../src/notifications/match.processor';
import { VehicleStatus, ListingStatus, UserType } from '@prisma/client';
import { CreateVehicleDto } from '../src/vehicles/dto/create-vehicle.dto';

describe('Flow Validation: Cadastro -> Moderação -> Alerta -> Chat (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let vehiclesService: VehiclesService;
  let matchProcessor: MatchProcessor;

  let sellerId: string;
  let buyerId: string;
  let brandId: string;
  let modelId: string;
  let versionId: string;
  let yearFabId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    vehiclesService = app.get(VehiclesService);
    matchProcessor = app.get(MatchProcessor);

    // Setup Test Data
    const seller = await prisma.user.upsert({
      where: { email: 'seller_test@pecae.com.br' },
      update: {},
      create: {
        email: 'seller_test@pecae.com.br',
        name: 'Seller Test',
        userType: UserType.SELLER,
        password: 'password123',
      },
    });

    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: seller.id },
      update: {},
      create: { userId: seller.id },
    });
    sellerId = sellerProfile.id;

    const buyer = await prisma.user.upsert({
      where: { email: 'buyer_test@pecae.com.br' },
      update: {},
      create: {
        email: 'buyer_test@pecae.com.br',
        name: 'Buyer Test',
        userType: UserType.BUYER,
        password: 'password123',
      },
    });
    buyerId = buyer.id;

    // Get real catalog data from seed
    const brand = await prisma.vehicleBrand.findFirst();
    if (!brand) throw new Error('No brands found. Please seed the database.');
    brandId = brand.id;
    
    const model = await prisma.vehicleModel.findFirst({ where: { brandId } });
    modelId = model!.id;
    
    const version = await prisma.vehicleVersion.findFirst({ where: { modelId } });
    versionId = version!.id;
    
    const year = await prisma.vehicleYear.findFirst({ where: { brandId } });
    yearFabId = year!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Step 1: Seller cadastras a vehicle (Starts as PENDING)', async () => {
    const dto: CreateVehicleDto = {
      versionId,
      yearFabId,
      color: 'Preto',
      plate: 'E2E-1234',
      city: 'São Paulo',
      state: 'SP',
      title: 'Sucata E2E Teste',
      observations: 'Teste E2E de fluxo completo',
      availableParts: [], 
    };

    const result = await vehiclesService.create(sellerId, dto);

    expect(result.vehicle).toBeDefined();
    expect(result.vehicle.status).toBe(VehicleStatus.PENDING);
    
    const listing = await prisma.listing.findFirst({
      where: { vehicleId: result.vehicle.id }
    });
    expect(listing).toBeDefined();
    expect(listing?.status).toBe(ListingStatus.PENDING);
  });

  it('Step 2 & 3: Moderator approves and Match Alerta is triggered', async () => {
    // 1. Create a Search Alert for Buyer that matches this vehicle
    await prisma.savedSearch.create({
      data: {
        userId: buyerId,
        alertActive: true,
        filters: {
          brandId,
          modelId,
          versionId,
        },
      },
    });

    // 2. Create the vehicle
    const dto: CreateVehicleDto = {
      versionId,
      yearFabId,
      color: 'Branco',
      plate: 'MATCH-123',
      city: 'Curitiba',
      state: 'PR',
      title: 'Veículo para Match',
      observations: 'Este deve gerar match',
      availableParts: [],
    };
    const result = await vehiclesService.create(sellerId, dto);
    const vehicle = result.vehicle;
    const listing = await prisma.listing.findFirst({ where: { vehicleId: vehicle.id } });

    // 3. Simulate Moderation Approval
    await prisma.listing.update({
      where: { id: listing!.id },
      data: { status: ListingStatus.PUBLISHED }
    });

    // 4. Manually trigger MatchProcessor
    // @ts-ignore
    await matchProcessor.handleMatchAlerts(listing!.id);

    // 5. Verify Notification for Buyer
    const notification = await prisma.notification.findFirst({
      where: { userId: buyerId, type: 'SAVED_SEARCH_ALERT' },
      orderBy: { createdAt: 'desc' }
    });

    expect(notification).toBeDefined();
    expect(notification?.title).toContain('Novo Match');
  });

  it('Step 4: Buyer initiates a Chat with Seller', async () => {
    const listing = await prisma.listing.findFirst({
      where: { status: ListingStatus.PUBLISHED }
    });

    const chatRoom = await prisma.chatRoom.create({
      data: {
        listingId: listing!.id,
        buyerId: buyerId,
        sellerId: sellerId,
      }
    });

    expect(chatRoom).toBeDefined();
    expect(chatRoom.buyerId).toBe(buyerId);
    expect(chatRoom.sellerId).toBe(sellerId);
  });
});
