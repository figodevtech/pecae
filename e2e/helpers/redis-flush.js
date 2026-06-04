const fs = require('fs');
const path = require('path');
const net = require('net');

// Carregador manual de arquivo .env
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
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

// Carregar variáveis de ambiente
const envTestPath = path.resolve(__dirname, '../../apps/api/.env.test');
loadEnvFile(envTestPath);

const host = process.env.REDIS_HOST || 'localhost';
const port = parseInt(process.env.REDIS_PORT || '6380', 10);

function flushall() {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host, port }, () => {
      // Comando RESP simples para FLUSHALL
      client.write('*1\r\n$8\r\nFLUSHALL\r\n');
    });

    client.on('data', (data) => {
      const response = data.toString().trim();
      if (response.startsWith('+OK') || response.includes('OK')) {
        client.end();
        resolve();
      } else {
        client.end();
        reject(new Error(`Redis response error: ${response}`));
      }
    });

    client.on('error', (err) => {
      reject(err);
    });

    client.setTimeout(3000, () => {
      client.end();
      reject(new Error('Redis connection timeout'));
    });
  });
}

flushall()
  .then(() => {
    console.log('Cache do Redis de testes limpo com sucesso.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(`[BRIDGE REDIS ERROR]:`, err);
    process.exit(1);
  });
