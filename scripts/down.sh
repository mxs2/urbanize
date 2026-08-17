#!/usr/bin/env bash
# Para os containers. Use `scripts/down.sh -v` para apagar também os volumes
# (dependências instaladas e o marcador de seed).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec docker compose -f "$ROOT_DIR/docker/docker-compose.yml" down "$@"
