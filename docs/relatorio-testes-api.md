# RELATÓRIO DE ENTREGA: AUTOMAÇÃO DE TESTES DE API
## Sistema sob Teste (SUT): Urbanize
**Disciplina:** Testes Automatizados de Software / Projeto Integrador  
**Data:** 09/09/2026  
**Squad:** Urbanize  

---

### Sumário
1. [Identificação do SUT Utilizado](#1-identificação-do-sut-utilizado)
2. [Endpoints Contemplados](#2-endpoints-contemplados)
3. [Relação dos Cenários Automatizados](#3-relação-dos-cenários-automatizados)
4. [Código-Fonte e Arquitetura da Suíte de Testes](#4-código-fonte-e-arquitetura-da-suíte-de-testes)
5. [Instruções Necessárias para Configuração e Execução](#5-instruções-necessárias-para-configuração-e-execução)
6. [Evidências da Execução dos Testes](#6-evidências-da-execução-dos-testes)
7. [Breve Análise dos Resultados Obtidos](#7-breve-análise-dos-resultados-obtidos)
8. [Registro dos Integrantes do Squad e Contribuições](#8-registro-dos-integrantes-do-squad-e-contribuições)

---

### 1. Identificação do SUT Utilizado

- **Nome da Aplicação:** Urbanize
- **Objetivo do Sistema:** Plataforma para registro, triagem e resolução de demandas municipais (vias danificadas, iluminação pública, saneamento, limpeza e zeladoria).
- **Arquitetura:** Backend Node.js v24 LTS com TypeScript em modo estrito, Express 5.2, Prisma ORM 7.8 com banco de dados SQLite local, validação de requisições com esquemas Zod e autenticação JWT.
- **Modelos de Dados:** Usuários (`User`), Demandas (`Demand`), Histórico de Auditoria (`DemandHistory`), Órgãos Públicos (`Organ`) e Snapshots de Métricas (`MetricsSnapshot`).
- **Níveis de Privilégio (RBAC):**
  - **Cidadão:** Acesso delimitado à criação de ocorrências e consulta exclusiva às demandas de sua própria autoria.
  - **Gestor:** Acesso a todas as ocorrências do município, permissão exclusiva de avanço de status e visão consolidada de métricas.

---

### 2. Endpoints Contemplados

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

---

### 3. Relação dos Cenários Automatizados

A suíte conta com **41 cenários automatizados**, distribuídos conforme a matriz de rastreabilidade abaixo:

| ID do Cenário | Endpoint Alvo | Tipo | Regra / Comportamento Verificado | Status HTTP | Resultado |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CT-AUTH-01** | `POST /api/auth/register` | Positivo | Cadastro válido de cidadão com geração de token e cookie | `201 Created` | 🟢 Pass |
| **CT-AUTH-02** | `POST /api/auth/register` | Negativo | Rejeição de cadastro com e-mail duplicado | `409 Conflict` | 🟢 Pass |
| **CT-AUTH-03** | `POST /api/auth/register` | Validação | Rejeição de payload com dados inválidos via Zod | `422 Unproc. Entity` | 🟢 Pass |
| **CT-AUTH-04** | `POST /api/auth/login` | Positivo | Autenticação bem-sucedida de cidadão demo | `200 OK` | 🟢 Pass |
| **CT-AUTH-05** | `POST /api/auth/login` | Positivo | Autenticação bem-sucedida de gestor demo | `200 OK` | 🟢 Pass |
| **CT-AUTH-06** | `POST /api/auth/login` | Negativo | Bloqueio de login com senha incorreta | `401 Unauthorized` | 🟢 Pass |
| **CT-AUTH-07** | `POST /api/auth/login` | Negativo | Bloqueio de login com e-mail inexistente | `401 Unauthorized` | 🟢 Pass |
| **CT-AUTH-08** | `GET /api/auth/me` | Positivo | Retorno dos dados do usuário logado via Bearer token | `200 OK` | 🟢 Pass |
| **CT-AUTH-09** | `GET /api/auth/me` | Segurança | Bloqueio de acesso sem cabeçalho Authorization | `401 Unauthorized` | 🟢 Pass |
| **CT-AUTH-10** | `GET /api/auth/me` | Segurança | Bloqueio de requisição com token JWT forjado | `401 Unauthorized` | 🟢 Pass |
| **CT-AUTH-11** | `POST /api/auth/logout` | Positivo | Encerramento de sessão e limpeza de cookies | `200 OK` | 🟢 Pass |
| **CT-DEM-01** | `POST /api/demands` | Positivo | Criação de demanda, geração de protocolo e histórico duplo | `201 Created` | 🟢 Pass |
| **CT-DEM-02** | `POST /api/demands` | Segurança | Rejeição de criação de demanda sem autenticação | `401 Unauthorized` | 🟢 Pass |
| **CT-DEM-03** | `POST /api/demands` | Validação | Rejeição de título muito curto (< 3 caracteres) | `422 Unproc. Entity` | 🟢 Pass |
| **CT-DEM-04** | `POST /api/demands` | Validação | Rejeição de descrição muito curta (< 5 caracteres) | `422 Unproc. Entity` | 🟢 Pass |
| **CT-DEM-05** | `POST /api/demands` | Validação | Rejeição de categoria inexistente | `422 Unproc. Entity` | 🟢 Pass |
| **CT-DEM-06** | `POST /api/demands` | Validação | Rejeição de demanda sem objeto de endereço | `422 Unproc. Entity` | 🟢 Pass |
| **CT-DEM-07** | `GET /api/demands` | Regra/Isolamento | Cidadão autenticado só visualiza demandas de sua autoria | `200 OK` | 🟢 Pass |
| **CT-DEM-08** | `GET /api/demands` | Regra | Gestor público visualiza demandas de todos os cidadãos | `200 OK` | 🟢 Pass |
| **CT-DEM-09** | `GET /api/demands` | Filtro | Filtragem exata por status operacional | `200 OK` | 🟢 Pass |
| **CT-DEM-10** | `GET /api/demands` | Filtro | Filtragem exata por categoria da demanda | `200 OK` | 🟢 Pass |
| **CT-DEM-11** | `GET /api/demands` | Filtro | Busca textual por protocolo ou termo do título | `200 OK` | 🟢 Pass |
| **CT-DEM-12** | `GET /api/demands` | Segurança | Rejeição de listagem de demandas sem autenticação | `401 Unauthorized` | 🟢 Pass |
| **CT-DEM-13** | `GET /api/demands/:id` | Positivo | Consulta a detalhes e histórico da própria demanda | `200 OK` | 🟢 Pass |
| **CT-DEM-14** | `GET /api/demands/:id` | Segurança | Impedimento de acesso a demanda de outro usuário (IDOR) | `403 Forbidden` | 🟢 Pass |
| **CT-DEM-15** | `GET /api/demands/:id` | Regra | Gestor consegue consultar demanda de qualquer cidadão | `200 OK` | 🟢 Pass |
| **CT-DEM-16** | `GET /api/demands/:id` | Negativo | Consulta a ID inexistente retorna erro padronizado | `404 Not Found` | 🟢 Pass |
| **CT-DEM-17** | `PATCH /api/demands/:id/status`| Segurança Crítica | Cidadão é expressamente proibido de alterar status (RBAC) | `403 Forbidden` | 🟢 Pass |
| **CT-DEM-18** | `PATCH /api/demands/:id/status`| Positivo | Gestor altera status e sistema audita evento no histórico | `200 OK` | 🟢 Pass |
| **CT-DEM-19** | `PATCH /api/demands/:id/status`| Validação | Rejeição de alteração para status inexistente no enum | `422 Unproc. Entity` | 🟢 Pass |
| **CT-DEM-20** | `PATCH /api/demands/:id/status`| Negativo | Atualização de status em ID inexistente | `404 Not Found` | 🟢 Pass |
| **CT-DEM-21** | `PATCH /api/demands/:id/status`| Segurança | Rejeição de alteração de status sem autenticação | `401 Unauthorized` | 🟢 Pass |
| **CT-MET-01** | `GET /api/metrics/summary` | Positivo | Gestor obtém indicadores agregados municipais | `200 OK` | 🟢 Pass |
| **CT-MET-02** | `GET /api/metrics/summary` | Regra/Isolamento | Cidadão recebe métricas calculadas apenas sobre suas demandas| `200 OK` | 🟢 Pass |
| **CT-MET-03** | `GET /api/metrics/summary` | Segurança | Rejeição de consulta de métricas sem token | `401 Unauthorized` | 🟢 Pass |
| **CT-ORG-01** | `GET /api/organs` | Positivo | Listagem ordenada de órgãos responsáveis | `200 OK` | 🟢 Pass |
| **CT-ORG-02** | `GET /api/organs` | Segurança | Rejeição de listagem de órgãos sem autenticação | `401 Unauthorized` | 🟢 Pass |
| **CT-GEN-01** | `GET /api` | Contrato | Retorno de metadados e catálogo de endpoints | `200 OK` | 🟢 Pass |
| **CT-GEN-02** | `GET /api/health` | Healthcheck | Confirmação de disponibilidade operacional (`ok`) | `200 OK` | 🟢 Pass |
| **CT-GEN-03** | `/api/nao-existe` | Negativo | Retorno 404 padronizado para rota inexistente | `404 Not Found` | 🟢 Pass |
| **CT-GEN-04** | `GET /` | Redirecionamento | Redirecionamento 302 da raiz para `/api` | `302 Found` | 🟢 Pass |

---

### 4. Código-Fonte e Arquitetura da Suíte de Testes

Os testes foram consolidados em `tests/acceptance/`, junto com os demais testes de aceitação do
backend, e rodam pelo `jest.config.js` já existente em `backend/` (mesmo runner usado por
`npm test` no backend):
- **`backend/jest.config.js`:** configura o runner Jest, com resolução de módulos TypeScript (`ts-jest`) e `roots` apontando para `tests/acceptance`.
- **`tests/acceptance/helpers/authHelper.ts`:** provê abstração para geração rápida de sessões de cidadão (`getCidadaoSession()`), gestor (`getGestorSession()`) e usuários dinâmicos descartáveis (`createUniqueUser()`).
- **`tests/acceptance/helpers/testDb.ts`:** gerencia o ciclo de vida do Prisma Client e limpeza determinística de dados gerados durante os testes.
- **`tests/acceptance/01_auth.test.ts` a `04_general.test.ts`:** quatro suítes modulares contendo asserções de cabeçalhos (`Content-Type: application/json`), formatos de payload, integridade de tokens e regras de negócio.

---

### 5. Instruções Necessárias para Configuração e Execução

Para reproduzir a execução dos testes em qualquer máquina com Node.js (v20+):

1. **Configuração da base de dados e dependências (no diretório `backend`):**
   ```bash
   cd backend
   npm install
   Copy-Item .env.example .env    # Windows PowerShell (ou cp .env.example .env no Linux)
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   ```

2. **Execução dos testes automatizados (ainda no diretório `backend`):**
   ```bash
   npm test
   ```

   Para rodar só a suíte de API/aceitação isoladamente:
   ```bash
   npx jest tests/acceptance
   ```

---

### 6. Evidências da Execução dos Testes

A execução da suíte completa (agora incluindo também `tests/acceptance/routes/authRoutes.test.ts`,
pré-existente) resultou em **100% de sucesso (44 de 44 testes)**:

```text
Test Suites: 5 passed, 5 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        3.284 s
```

O log original desta entrega (41 de 41, antes da consolidação em `tests/acceptance/`) foi salvo em:
`docs/evidencias-testes-api/test-run-output.txt`

---

### 7. Breve Análise dos Resultados Obtidos

1. **Robustez no Tratamento de Erros e Códigos HTTP Semânticos:**  
   O SUT adota o código **422 (Unprocessable Entity)** para falhas de validação de esquema (via Zod), acompanhado de mensagens e caminhos claros em `details`. Isso diferencia claramente um payload malformado sintaticamente (400) de um payload com dados que não atendem às regras de domínio (422), facilitando o tratamento de erros no cliente mobile.

2. **Eficácia no Controle de Acesso e Segurança (RBAC):**  
   O SUT demonstrou rigor inviolável nas permissões por perfil. Cidadãos foram categoricamente impedidos de alterar status (`403 Forbidden`) e de visualizar ocorrências de outros cidadãos via ID (`403 Forbidden`), mitigando plenamente vulnerabilidades clássicas como IDOR (*Insecure Direct Object Reference*) e elevação de privilégios.

3. **Autonomia e Reprodutibilidade:**  
   A suíte de testes executa de forma totalmente autocontida e rápida (~4 segundos), sem depender de chamadas externas de rede à API do Google Cloud Vision ou instâncias externas do Redis, viabilizando sua integração imediata em esteiras de Integração Contínua (CI/CD via GitHub Actions).

---

### 8. Registro dos Integrantes do Squad e Contribuições

Conforme a alocação oficial de responsabilidades documentada em `docs/alocacao-equipe.md`, discriminam-se as contribuições de cada integrante para a atividade:

| Integrante | Área Principal | Contribuição na Atividade |
| :--- | :--- | :--- |
| **Enzo Antuna** | Testes | Modelagem e automação dos testes de ciclo de vida de demandas, filtros avançados e integridade do histórico. |
| **Mateus Xavier** | Project Management | Planejamento das metas de teste, priorização dos casos P0/P1 no backlog e revisão técnica da entrega. |
| **Diego Xavier** | Mobile | Validação da consistência dos contratos e cabeçalhos retornados pela API com os fluxos do app móvel. |
| **Jamilla Lobo** | Dados | Análise da integridade relacional entre Demandas e Histórico e asserções da agregação estatística de métricas. |
| **Janderson** | Negócios / Documentação | Mapeamento das regras de negócio do SUT para a matriz de cenários e elaboração da análise de resultados. |
| **Hyngrid** | Documentação | Estruturação e redação técnica do relatório de entrega e conferência de requisitos da atividade. |
| **Pamela** | Branding/Design | Avaliação da clareza das mensagens de erro retornadas pela API para garantia de boa experiência do usuário. |
