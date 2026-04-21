#!/bin/sh

# Aguardar o banco de dados estar pronto (opcional, o Prisma lida com retentativas basicas)
echo "Starting PECAE API..."

# Rodar migracoes pendentes em producao
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

# Iniciar a aplicacao
echo "Starting NestJS server..."

# Procurar o arquivo main.js se nao estiver no local esperado (comum em monorepos)
if [ -f "apps/api/dist/main.js" ]; then
    node apps/api/dist/main.js
else
    echo "🔍 main.js not found in apps/api/dist/, searching recursively..."
    FOUND_MAIN=$(find apps/api/dist -name "main.js" | head -n 1)
    if [ -n "$FOUND_MAIN" ]; then
        echo "✅ Found main.js at: $FOUND_MAIN"
        node "$FOUND_MAIN"
    else
        echo "❌ CRITICAL: main.js not found in apps/api/dist!"
        ls -R apps/api/dist
        exit 1
    fi
fi
