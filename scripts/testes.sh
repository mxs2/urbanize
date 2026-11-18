#!/usr/bin/env bash
# Roda a suíte de unitários + API (Jest e BDD) com um único comando, igual ao CI (regressao.yml).
# Uso (na raiz do repositório): bash scripts/testes.sh
# Resultado: logs e JUnit em test-results/unitarios e test-results/api. Sai com 1 se algum nível falhar.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p test-results/unitarios test-results/api
falhou=0

echo "== Unitários (mobile)"
npm ci --prefix mobile --no-audit --no-fund >/dev/null || exit 1
(cd mobile && JEST_JUNIT_OUTPUT_DIR=../test-results/unitarios JEST_JUNIT_OUTPUT_NAME=junit.xml \
  npm test -- --ci --reporters=default --reporters=jest-junit 2>&1 | tee ../test-results/unitarios/jest.log) || falhou=1

echo "== API (backend: SQLite + seed)"
npm ci --prefix backend --no-audit --no-fund >/dev/null || exit 1
(
  cd backend
  [ -f .env ] || cp .env.example .env
  npx prisma generate >/dev/null && npx prisma migrate deploy >/dev/null && npm run db:seed >/dev/null || exit 1
  JEST_JUNIT_OUTPUT_DIR=../test-results/api JEST_JUNIT_OUTPUT_NAME=junit-jest.xml \
    npm test -- --ci --reporters=default --reporters=jest-junit 2>&1 | tee ../test-results/api/jest.log
) || falhou=1

echo "== API (BDD)"
(cd backend && npm run test:bdd -- --format junit:../test-results/api/junit-bdd.xml 2>&1 | tee ../test-results/api/bdd.log) || falhou=1

[ "$falhou" = 0 ] && echo "== Tudo verde. Logs em test-results/" || echo "== Houve falhas. Veja test-results/"
exit "$falhou"
