import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: 'comprador@pecae.com.br' },
  });
  console.log('USER IN DB:', user);
  await prisma.$disconnect();
}

main();
