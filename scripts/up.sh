#!/usr/bin/env bash
# Sobe todo o ambiente: prepara os arquivos .env e inicia os containers.
# Qualquer argumento extra é repassado ao `docker compose up`.
#
# Uso: scripts/up.sh [--build] [-d] ...
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose não encontrado. Instale o Docker Desktop ou o plugin docker-compose-plugin." >&2
  exit 1
fi

"$ROOT_DIR/scripts/setup-env.sh"

exec docker compose -f "$ROOT_DIR/docker/docker-compose.yml" up --build "$@"
