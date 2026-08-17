#!/bin/sh
# Prepara o banco antes de subir a API. Roda a cada `docker compose up`, então
# tudo aqui precisa ser idempotente.
set -e

cd /app

# O bind mount do código esconde o node_modules da imagem; o volume nomeado é
# semeado a partir dela, mas se estiver vazio (primeira subida) reinstalamos.
if [ ! -x node_modules/.bin/prisma ]; then
  echo "[entrypoint] Instalando dependências..."
  npm ci
fi

echo "[entrypoint] Gerando o Prisma Client..."
npx prisma generate

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

# Marcador no volume de dependências para não repovoar o banco a cada subida.
SEED_MARKER="node_modules/.urbanize-seeded"
if [ ! -f "$SEED_MARKER" ]; then
  echo "[entrypoint] Populando o banco com os dados iniciais..."
  npm run db:seed
  touch "$SEED_MARKER"
fi

exec "$@"
