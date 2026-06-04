const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Carregador manual e resiliente de arquivo .env (evita dependência direta do dotenv na raiz)
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          let value = trimmed.substring(index + 1).trim();
          // Remove aspas
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

// Carregar variáveis de ambiente do banco de testes da API
const envTestPath = path.resolve(__dirname, '../../apps/api/.env.test');
loadEnvFile(envTestPath);

// Configurar o Prisma Client para usar a URL carregada
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // Ler SQL da entrada padrão (stdin)
  let sql = '';
  process.stdin.setEncoding('utf-8');
  for await (const chunk of process.stdin) {
    sql += chunk;
  }

  if (!sql.trim()) {
    process.exit(0);
  }

  try {
    const result = await prisma.$queryRawUnsafe(sql);
    
    if (Array.isArray(result)) {
      result.forEach(row => {
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return '';
          if (val instanceof Date) return val.toISOString();
          return String(val);
        });
        console.log(values.join('|'));
      });
    } else if (result !== null && result !== undefined) {
      console.log(String(result));
    }
  } catch (error) {
    console.error(`[BRIDGE SQL ERROR]: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
