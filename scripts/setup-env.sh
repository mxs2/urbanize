#!/usr/bin/env bash
# Cria e preenche os arquivos de ambiente (backend/.env, mobile/.env e docker/.env)
# a partir dos .env.example, detectando o IP da máquina na rede local e gerando
# um JWT_SECRET aleatório. Idempotente: só preenche o que ainda está no padrão.
#
# Uso: scripts/setup-env.sh [--force] [--ip <endereço>]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE=0
LAN_IP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --ip) LAN_IP="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,7p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Opção desconhecida: $1" >&2; exit 1 ;;
  esac
done

log() { printf '\033[36m[setup]\033[0m %s\n' "$1"; }

detect_lan_ip() {
  case "$(uname -s)" in
    MINGW* | MSYS* | CYGWIN*)
      # Git Bash no Windows: o PowerShell devolve o IP sem depender do idioma do
      # `ipconfig`. Menor InterfaceMetric = adaptador realmente usado para sair.
      powershell.exe -NoProfile -Command \
        "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' -and \$_.IPAddress -notlike '169.254.*' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress" \
        2>/dev/null | tr -d '\r\n '
      ;;
    Darwin)
      ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null
      ;;
    *)
      ip -4 -o addr show scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -n1
      ;;
  esac
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-48
  else
    head -c 48 /dev/urandom | base64 | tr -d '\n/+=' | cut -c1-48
  fi
}

# set_env <arquivo> <chave> <valor> — substitui a chave se existir, senão adiciona.
set_env() {
  local file="$1" key="$2" value="$3"
  if grep -qE "^${key}=" "$file"; then
    local escaped
    escaped=$(printf '%s' "$value" | sed -e 's/[\/&]/\\&/g')
    sed -i.bak -E "s/^${key}=.*/${key}=\"${escaped}\"/" "$file" && rm -f "${file}.bak"
  else
    printf '\n%s="%s"\n' "$key" "$value" >> "$file"
  fi
}

get_env() {
  grep -E "^$2=" "$1" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d '"' || true
}

ensure_from_example() {
  local target="$1" example="$2"
  if [[ -f "$target" && $FORCE -eq 0 ]]; then
    log "$(basename "$(dirname "$target")")/$(basename "$target") já existe — mantendo."
  else
    cp "$example" "$target"
    log "Criado $(basename "$(dirname "$target")")/$(basename "$target") a partir do exemplo."
  fi
}

[[ -n "$LAN_IP" ]] || LAN_IP="$(detect_lan_ip || true)"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="127.0.0.1"
  log "Não foi possível detectar o IP da rede local; usando 127.0.0.1."
  log "Para testar em celular físico rode: scripts/setup-env.sh --force --ip <seu-ip>"
else
  log "IP da rede local detectado: $LAN_IP"
fi

# --- backend/.env ------------------------------------------------------------
BACKEND_ENV="$ROOT_DIR/backend/.env"
ensure_from_example "$BACKEND_ENV" "$ROOT_DIR/backend/.env.example"

CURRENT_SECRET="$(get_env "$BACKEND_ENV" JWT_SECRET)"
if [[ -z "$CURRENT_SECRET" || "$CURRENT_SECRET" == "troque-este-segredo" ]]; then
  set_env "$BACKEND_ENV" JWT_SECRET "$(random_secret)"
  log "JWT_SECRET gerado."
fi
set_env "$BACKEND_ENV" BACKEND_HOST "0.0.0.0"

# --- mobile/.env -------------------------------------------------------------
MOBILE_ENV="$ROOT_DIR/mobile/.env"
ensure_from_example "$MOBILE_ENV" "$ROOT_DIR/mobile/.env.example"

BACKEND_PORT="$(get_env "$BACKEND_ENV" BACKEND_PORT)"
BACKEND_PORT="${BACKEND_PORT:-4000}"
set_env "$MOBILE_ENV" EXPO_PUBLIC_API_URL "http://${LAN_IP}:${BACKEND_PORT}/api"
log "EXPO_PUBLIC_API_URL apontando para http://${LAN_IP}:${BACKEND_PORT}/api"

# --- docker/.env (lido automaticamente pelo compose) -------------------------
# Portas publicadas no host e o IP usado pelo Metro; o resto vem de backend/.env.
DOCKER_ENV="$ROOT_DIR/docker/.env"
REDIS_PORT="$(get_env "$DOCKER_ENV" REDIS_PORT)"
METRO_PORT="$(get_env "$DOCKER_ENV" METRO_PORT)"
{
  echo "HOST_LAN_IP=${LAN_IP}"
  echo "BACKEND_PORT=${BACKEND_PORT}"
  echo "REDIS_PORT=${REDIS_PORT:-6379}"
  echo "METRO_PORT=${METRO_PORT:-8081}"
} > "$DOCKER_ENV"

log "Ambiente pronto."
