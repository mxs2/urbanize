# Resumo Executivo da Execução dos Testes

- **Data da Execução:** 09/09/2026
- **Ambiente:** Node.js v24.13.0, Express 5.2.1, Jest 30.4.2, Supertest 7.2.2, Prisma 7.8.0, SQLite (in-memory / file db)
- **Status Geral:** 🟢 **100% APROVADO (41/41 testes)**
- **Tempo Total:** ~4.06 segundos

## Métricas por Arquivo de Teste

| Suíte de Testes | Cenários Executados | Cenários Aprovados | Falhas | Tempo de Execução |
| :--- | :---: | :---: | :---: | :---: |
| `tests/01_auth.test.ts` | 11 | 11 | 0 | ~650 ms |
| `tests/02_demands.test.ts` | 21 | 21 | 0 | ~780 ms |
| `tests/03_metrics_and_organs.test.ts` | 5 | 5 | 0 | ~60 ms |
| `tests/04_general.test.ts` | 4 | 4 | 0 | ~40 ms |
| **TOTAL** | **41** | **41** | **0** | **4.06 s** |

## Distribuição dos Cenários por Código de Status HTTP Validado

- **200 OK:** 16 cenários (Logins, /me, listagens filtradas, detalhes de demandas, métricas, órgãos, healthcheck, catálogo e logout)
- **201 Created:** 2 cenários (Registro de usuário e criação de demanda)
- **302 Found:** 1 cenário (Redirecionamento da raiz `/` para `/api`)
- **401 Unauthorized:** 11 cenários (Sessões não autenticadas, tokens expirados ou adulterados, credenciais inválidas)
- **403 Forbidden:** 2 cenários (Cidadão tentando alterar status de demanda [RBAC] e Cidadão tentando acessar demanda de outro cidadão [IDOR])
- **404 Not Found:** 3 cenários (Demanda inexistente por ID, rota de API inexistente e atualização em ID inexistente)
- **409 Conflict:** 1 cenário (Registro duplicado com email já existente)
- **422 Unprocessable Entity:** 5 cenários (Validações de schema Zod: dados ausentes, strings muito curtas, enums inválidos)
