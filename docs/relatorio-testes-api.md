# Relatório de entrega: automação de testes de API

Sistema sob teste (SUT): Urbanize. Disciplina: Testes Automatizados de Software / Projeto Integrador.
Entregue em 09/09/2026 pela squad Urbanize.

## Sumário
1. [Identificação do SUT Utilizado](#1-identificação-do-sut-utilizado)
2. [Endpoints Contemplados](#2-endpoints-contemplados)
3. [Relação dos Cenários Automatizados](#3-relação-dos-cenários-automatizados)
4. [Código-Fonte e Arquitetura da Suíte de Testes](#4-código-fonte-e-arquitetura-da-suíte-de-testes)
5. [Instruções Necessárias para Configuração e Execução](#5-instruções-necessárias-para-configuração-e-execução)
6. [Evidências da Execução dos Testes](#6-evidências-da-execução-dos-testes)
7. [Breve Análise dos Resultados Obtidos](#7-breve-análise-dos-resultados-obtidos)
8. [Registro dos Integrantes do Squad e Contribuições](#8-registro-dos-integrantes-do-squad-e-contribuições)

## 1. Identificação do SUT Utilizado

O Urbanize é uma plataforma para registrar, triar e resolver demandas municipais (vias danificadas,
iluminação pública, saneamento, limpeza e zeladoria).

- Backend: Node.js 24 com TypeScript em modo estrito, Express 5.2, Prisma 7.8 sobre SQLite, validação
  com Zod e autenticação JWT.
- Modelos: `User`, `Demand`, `DemandHistory` (histórico de status), `Organ` e `MetricsSnapshot`.
- Perfis:
  - Cidadão: cria demandas e consulta só as próprias.
  - Gestor: vê todas as demandas do município, é o único que altera status e vê as métricas gerais.

## 2. Endpoints Contemplados

| Endpoint | Método | Descrição da Operação | Nível de Acesso | Validações Chave |
| :--- | :---: | :--- | :--- | :--- |
| `/api` | `GET` | Catálogo e metadados da API | Público | Status 200, links dos recursos |
| `/api/health` | `GET` | Verificação de disponibilidade | Público | Status 200, liveness probe |
| `/api/auth/register` | `POST` | Cadastro de novos usuários | Público | 201 Created, token JWT, sanitização de senha, 409 duplicado, 422 validação |
| `/api/auth/login` | `POST` | Autenticação de credenciais | Público | 200 OK, token JWT, cookie httpOnly, 401 para credenciais incorretas |
| `/api/auth/me` | `GET` | Identificação da sessão corrente | Autenticado | 200 OK com dados do usuário, 401 sem token, 401 token forjado |
| `/api/auth/logout` | `POST` | Encerramento de sessão | Público | 200 OK, invalidação de cookie de sessão |
| `/api/demands` | `POST` | Registro de nova ocorrência | Autenticado | 201 Created, protocolo URB-XXXXX, status em_analise, histórico duplo, 422 em inputs curtos/inválidos |
| `/api/demands` | `GET` | Listagem e consulta com filtros | Autenticado | 200 OK, cidadão só vê suas demandas, gestor vê tudo, filtros por status, categoria e busca |
| `/api/demands/:id` | `GET` | Consulta a detalhes e timeline | Autenticado | 200 OK para dono ou gestor, 403 Forbidden para cidadão invasor (IDOR), 404 ID inexistente |
| `/api/demands/:id/status` | `PATCH` | Alteração de status e histórico | **Gestor** | 200 OK com histórico auditado, 403 Forbidden se cidadão tentar alterar, 422 status inválido, 404 inexistente |
| `/api/metrics/summary` | `GET` | Indicadores consolidados | Autenticado | 200 OK, gestor recebe agregados municipais, cidadão recebe apenas seus números |
| `/api/organs` | `GET` | Listagem de órgãos públicos | Autenticado | 200 OK, ordenação alfabética por nome, dados de contato e categorias atendidas |

## 3. Relação dos Cenários Automatizados

A suíte tem 41 cenários automatizados:

| ID do Cenário | Endpoint Alvo | Tipo | Regra / Comportamento Verificado | Status HTTP | Resultado |
| :--- | :--- | :--- | :--- | :---: | :---: |
| CT-AUTH-01 | `POST /api/auth/register` | Positivo | Cadastro válido de cidadão com geração de token e cookie | `201 Created` | Passou |
| CT-AUTH-02 | `POST /api/auth/register` | Negativo | Rejeição de cadastro com e-mail duplicado | `409 Conflict` | Passou |
| CT-AUTH-03 | `POST /api/auth/register` | Validação | Rejeição de payload com dados inválidos via Zod | `422 Unproc. Entity` | Passou |
| CT-AUTH-04 | `POST /api/auth/login` | Positivo | Autenticação bem-sucedida de cidadão demo | `200 OK` | Passou |
| CT-AUTH-05 | `POST /api/auth/login` | Positivo | Autenticação bem-sucedida de gestor demo | `200 OK` | Passou |
| CT-AUTH-06 | `POST /api/auth/login` | Negativo | Bloqueio de login com senha incorreta | `401 Unauthorized` | Passou |
| CT-AUTH-07 | `POST /api/auth/login` | Negativo | Bloqueio de login com e-mail inexistente | `401 Unauthorized` | Passou |
| CT-AUTH-08 | `GET /api/auth/me` | Positivo | Retorno dos dados do usuário logado via Bearer token | `200 OK` | Passou |
| CT-AUTH-09 | `GET /api/auth/me` | Segurança | Bloqueio de acesso sem cabeçalho Authorization | `401 Unauthorized` | Passou |
| CT-AUTH-10 | `GET /api/auth/me` | Segurança | Bloqueio de requisição com token JWT forjado | `401 Unauthorized` | Passou |
| CT-AUTH-11 | `POST /api/auth/logout` | Positivo | Encerramento de sessão e limpeza de cookies | `200 OK` | Passou |
| CT-DEM-01 | `POST /api/demands` | Positivo | Criação de demanda, geração de protocolo e histórico duplo | `201 Created` | Passou |
| CT-DEM-02 | `POST /api/demands` | Segurança | Rejeição de criação de demanda sem autenticação | `401 Unauthorized` | Passou |
| CT-DEM-03 | `POST /api/demands` | Validação | Rejeição de título muito curto (< 3 caracteres) | `422 Unproc. Entity` | Passou |
| CT-DEM-04 | `POST /api/demands` | Validação | Rejeição de descrição muito curta (< 5 caracteres) | `422 Unproc. Entity` | Passou |
| CT-DEM-05 | `POST /api/demands` | Validação | Rejeição de categoria inexistente | `422 Unproc. Entity` | Passou |
| CT-DEM-06 | `POST /api/demands` | Validação | Rejeição de demanda sem objeto de endereço | `422 Unproc. Entity` | Passou |
| CT-DEM-07 | `GET /api/demands` | Regra/Isolamento | Cidadão autenticado só visualiza demandas de sua autoria | `200 OK` | Passou |
| CT-DEM-08 | `GET /api/demands` | Regra | Gestor público visualiza demandas de todos os cidadãos | `200 OK` | Passou |
| CT-DEM-09 | `GET /api/demands` | Filtro | Filtragem exata por status operacional | `200 OK` | Passou |
| CT-DEM-10 | `GET /api/demands` | Filtro | Filtragem exata por categoria da demanda | `200 OK` | Passou |
| CT-DEM-11 | `GET /api/demands` | Filtro | Busca textual por protocolo ou termo do título | `200 OK` | Passou |
| CT-DEM-12 | `GET /api/demands` | Segurança | Rejeição de listagem de demandas sem autenticação | `401 Unauthorized` | Passou |
| CT-DEM-13 | `GET /api/demands/:id` | Positivo | Consulta a detalhes e histórico da própria demanda | `200 OK` | Passou |
| CT-DEM-14 | `GET /api/demands/:id` | Segurança | Impedimento de acesso a demanda de outro usuário (IDOR) | `403 Forbidden` | Passou |
| CT-DEM-15 | `GET /api/demands/:id` | Regra | Gestor consegue consultar demanda de qualquer cidadão | `200 OK` | Passou |
| CT-DEM-16 | `GET /api/demands/:id` | Negativo | Consulta a ID inexistente retorna erro padronizado | `404 Not Found` | Passou |
| CT-DEM-17 | `PATCH /api/demands/:id/status`| Segurança Crítica | Cidadão é expressamente proibido de alterar status (RBAC) | `403 Forbidden` | Passou |
| CT-DEM-18 | `PATCH /api/demands/:id/status`| Positivo | Gestor altera status e sistema audita evento no histórico | `200 OK` | Passou |
| CT-DEM-19 | `PATCH /api/demands/:id/status`| Validação | Rejeição de alteração para status inexistente no enum | `422 Unproc. Entity` | Passou |
| CT-DEM-20 | `PATCH /api/demands/:id/status`| Negativo | Atualização de status em ID inexistente | `404 Not Found` | Passou |
| CT-DEM-21 | `PATCH /api/demands/:id/status`| Segurança | Rejeição de alteração de status sem autenticação | `401 Unauthorized` | Passou |
| CT-MET-01 | `GET /api/metrics/summary` | Positivo | Gestor obtém indicadores agregados municipais | `200 OK` | Passou |
| CT-MET-02 | `GET /api/metrics/summary` | Regra/Isolamento | Cidadão recebe métricas calculadas apenas sobre suas demandas| `200 OK` | Passou |
| CT-MET-03 | `GET /api/metrics/summary` | Segurança | Rejeição de consulta de métricas sem token | `401 Unauthorized` | Passou |
| CT-ORG-01 | `GET /api/organs` | Positivo | Listagem ordenada de órgãos responsáveis | `200 OK` | Passou |
| CT-ORG-02 | `GET /api/organs` | Segurança | Rejeição de listagem de órgãos sem autenticação | `401 Unauthorized` | Passou |
| CT-GEN-01 | `GET /api` | Contrato | Retorno de metadados e catálogo de endpoints | `200 OK` | Passou |
| CT-GEN-02 | `GET /api/health` | Healthcheck | Confirmação de disponibilidade operacional (`ok`) | `200 OK` | Passou |
| CT-GEN-03 | `/api/nao-existe` | Negativo | Retorno 404 padronizado para rota inexistente | `404 Not Found` | Passou |
| CT-GEN-04 | `GET /` | Redirecionamento | Redirecionamento 302 da raiz para `/api` | `302 Found` | Passou |

## 4. Código-Fonte e Arquitetura da Suíte de Testes

Os testes foram consolidados em `tests/acceptance/`, junto com os demais testes de aceitação do
backend, e rodam pelo `jest.config.js` já existente em `backend/` (mesmo runner usado por
`npm test` no backend):
- `backend/jest.config.js`: configura o Jest com `ts-jest` e `roots` apontando para `tests/acceptance`.
- `tests/acceptance/helpers/authHelper.ts`: cria sessões de cidadão (`getCidadaoSession()`), de gestor
  (`getGestorSession()`) e usuários descartáveis (`createUniqueUser()`).
- `tests/acceptance/helpers/testDb.ts`: controla o Prisma Client e apaga os dados criados pelos testes.
- `tests/acceptance/01_auth.test.ts` a `04_general.test.ts`: quatro suítes que verificam cabeçalhos
  (`Content-Type: application/json`), formato das respostas, tokens e regras de negócio.

## 5. Instruções Necessárias para Configuração e Execução

Para reproduzir a execução em uma máquina com Node.js 20 ou superior:

1. Prepare o banco e as dependências (em `backend/`):
   ```bash
   cd backend
   npm install
   Copy-Item .env.example .env    # Windows PowerShell (ou cp .env.example .env no Linux)
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   ```

2. Rode os testes (ainda em `backend/`):
   ```bash
   npm test
   ```

   Para rodar só a suíte de API/aceitação isoladamente:
   ```bash
   npx jest tests/acceptance
   ```

## 6. Evidências da Execução dos Testes

A execução da suíte completa (agora incluindo também `tests/acceptance/routes/authRoutes.test.ts`,
que já existia) passou nos 44 testes:

```text
Test Suites: 5 passed, 5 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        3.284 s
```

O log original desta entrega (41 de 41, antes da consolidação em `tests/acceptance/`) foi salvo em:
`docs/evidencias-testes-api/test-run-output.txt`

## 7. Breve Análise dos Resultados Obtidos

1. Erros de validação. A API responde 422 quando o corpo não passa no schema do Zod, com o campo e a
   mensagem em `details`. Isso separa um JSON malformado (400) de dados que não cumprem as regras (422)
   e simplifica o tratamento de erro no app.

2. Controle de acesso. Os testes confirmaram que o cidadão não altera status (403) nem abre demandas de
   outra pessoa pelo ID (403), o que cobre os casos de IDOR e de elevação de privilégio testados.

3. Reprodutibilidade. A suíte roda em cerca de 4 segundos e não depende de serviços externos (Google
   Vision, Redis), o que permite rodá-la na pipeline do GitHub Actions.

## 8. Registro dos Integrantes do Squad e Contribuições

Contribuições de cada integrante, seguindo a divisão de [alocacao-equipe.md](alocacao-equipe.md):

| Integrante | Área Principal | Contribuição na Atividade |
| :--- | :--- | :--- |
| Enzo Antuna | Testes | Modelagem e automação dos testes de ciclo de vida de demandas, filtros avançados e integridade do histórico. |
| Mateus Xavier | Project Management | Planejamento das metas de teste, priorização dos casos P0/P1 no backlog e revisão técnica da entrega. |
| Diego Xavier | Mobile | Validação da consistência dos contratos e cabeçalhos retornados pela API com os fluxos do app móvel. |
| Jamilla Lobo | Dados | Análise da integridade relacional entre Demandas e Histórico e asserções da agregação estatística de métricas. |
| Janderson | Negócios / Documentação | Mapeamento das regras de negócio do SUT para a matriz de cenários e elaboração da análise de resultados. |
| Hyngrid | Documentação | Estruturação e redação técnica do relatório de entrega e conferência de requisitos da atividade. |
| Pamela | Branding/Design | Avaliação da clareza das mensagens de erro retornadas pela API para garantia de boa experiência do usuário. |
