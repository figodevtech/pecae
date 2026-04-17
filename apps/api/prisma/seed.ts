import { PrismaClient, UserType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================
// PART CATEGORIES — Fixed list (M05 reference)
// ============================================================
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
];

// ============================================================
// ADMIN USER — Development seed only
// ============================================================
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
    update: {},
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

// ============================================================
// PART CATEGORIES SEED — Idempotent upsert
// ============================================================
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

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🌱 Starting PECAÊ database seed...');

  await seedPartCategories();
  await seedAdminUser();

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
