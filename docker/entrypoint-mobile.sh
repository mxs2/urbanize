#!/bin/sh
# Garante as dependências antes de subir o Metro. O bind mount do código esconde
# o node_modules da imagem, então o volume nomeado pode chegar vazio.
set -e

cd /app

if [ ! -x node_modules/.bin/expo ]; then
  echo "[entrypoint] Instalando dependências do app..."
  npm ci
fi

echo "[entrypoint] Metro em http://0.0.0.0:8081 — API em ${EXPO_PUBLIC_API_URL:-(padrão)}"

exec "$@"
