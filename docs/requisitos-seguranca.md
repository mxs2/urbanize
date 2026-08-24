# Requisitos e Análise de Riscos de Segurança — Urbanize

**Disciplina:** Segurança da Informação (SEG) — Entrega Unidade 1
**Referente a:** [#14](https://github.com/mxs2/urbanize/issues/14)
**Escopo analisado:** `backend/` (Express + Prisma) e `mobile/` (Expo/React Native)

## 1. Contexto

O Urbanize coleta e processa dados pessoais de cidadãos ao registrar demandas urbanas: nome, e-mail, telefone, endereço, geolocalização (GPS) e fotos do problema relatado. Esses dados trafegam entre o app mobile e o backend, e ficam armazenados em um banco SQLite via Prisma. Por tratar dados pessoais de forma habitual, o sistema está sujeito à LGPD (Lei 13.709/2018).

Esta análise foi feita lendo o código-fonte atual (backend e mobile), não apenas documentação — cada requisito abaixo cita o arquivo correspondente para facilitar auditoria e priorização pela squad SEG e pela squad MOB.

## 2. Análise de riscos e ameaças

| ID | Ameaça | Vetor | Probabilidade | Impacto | Risco | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Escalonamento de privilégio não autenticado | `POST /api/auth/register` aceita `role` vindo do cliente | Alta | Alto | **Crítico** | `backend/src/controllers/authController.ts:14-18`, `backend/src/services/authService.ts:24-31` |
| R2 | Roubo de sessão via token em texto plano | JWT persistido em `AsyncStorage` (não criptografado) no mobile | Média | Alto | **Alto** | `mobile/src/store/authStore.ts:67`, `mobile/src/services/session.ts:19` |
| R3 | Forjamento de token por segredo fraco | Fallback hardcoded `"urbanize-dev-secret-change-me"` se `JWT_SECRET` não for definido | Baixa (se `.env` configurado) / Alta (se esquecido em deploy) | Alto | **Alto** | `backend/src/config/env.ts:35` |
| R4 | Exposição de dados pessoais em fotos de demandas | `/uploads` servido como estático, sem `requireAuth` | Média | Médio-Alto | **Alto** | `backend/src/app.ts:22` |
| R5 | Interceptação de credenciais/dados em trânsito | Nenhuma configuração de TLS em nenhum ambiente (nem docker-compose) | Média (rede não confiável) | Alto | **Alto** | `docker/docker-compose.yml` (healthcheck e `EXPO_PUBLIC_API_URL` em HTTP) |
| R6 | Força bruta / credential stuffing | Sem rate limiting em `/api/auth/login` e `/api/auth/register` | Média | Médio | **Médio** | ausência de `express-rate-limit` em `backend/package.json` |
| R7 | Senhas fracas | `senha: z.string().min(1)` aceita senha de 1 caractere | Alta | Médio | **Médio** | `backend/src/controllers/authController.ts:11` |
| R8 | Acesso indevido entre órgãos | Gestor não é restrito ao seu `organId`; vê/atualiza demandas de qualquer órgão | Baixa-Média | Médio | **Médio** | `backend/src/services/demandService.ts:39-49` |
| R9 | Dificuldade de resposta a incidentes | Sem log/auditoria de login, cadastro ou mudança de papel | Média | Médio | **Médio** | ausência de `winston`/`morgan`/auditoria em `backend/src` |
| R10 | Compartilhamento de dados pessoais com terceiro sem base legal clara | Fotos enviadas a um serviço de visão computacional (Google Vision) para triagem | Baixa | Médio | **Baixo-Médio** | `backend/src/config/env.ts:40` (`GOOGLE_VISION_CREDENTIALS`) |

## 3. Requisitos de segurança detalhados

### Autenticação
- **RS01** — Senhas devem ser armazenadas com hash forte e salt (bcrypt/argon2), nunca em texto plano.
  ✅ Atendido — `bcryptjs`, custo 10 (`backend/src/services/authService.ts:28,36`).
- **RS02** — Senhas devem ter comprimento mínimo e regras básicas de complexidade.
  ❌ Não atendido — mínimo de 1 caractere (`authController.ts:11`). **Ação:** exigir mínimo de 8 caracteres.
- **RS03** — Deve haver limite de tentativas de login/cadastro por IP/conta (rate limiting).
  ❌ Não atendido. **Ação:** adicionar `express-rate-limit` nas rotas `/auth/*`.
- **RS04** — Tokens de sessão devem ter tempo de expiração definido e mecanismo de renovação seguro.
  ⚠️ Parcial — expiração de 7 dias configurável (`env.ts:35-36`), mas sem refresh token; um token comprometido continua válido por até 7 dias sem forma de revogação central.

### Autorização
- **RS05** — O papel (role) do usuário deve ser atribuído apenas pelo servidor, nunca por dado enviado pelo cliente no cadastro público.
  ❌ **Não atendido — crítico.** Ver R1. **Ação:** remover `role` do payload de `/register` (ou restringir a `cidadao` por padrão; atribuição de `gestor` deve exigir convite/aprovação administrativa).
- **RS06** — Toda rota que manipula dados de outro usuário deve verificar propriedade (ownership) ou papel adequado.
  ✅ Atendido no nível de demanda (`demandService.ts:27-36`, `130-131`), mas ⚠️ sem escopo por `organId` para gestores (R8).
- **RS07** — Deve existir um único ponto centralizado de checagem de papel (middleware), evitando checagens ad-hoc espalhadas.
  ⚠️ Parcial — `requireRole` existe (`authMiddleware.ts:43-51`) mas não é usado; checagens estão embutidas nos services.

### Criptografia em trânsito
- **RS08** — Toda comunicação entre app mobile e backend deve usar TLS (HTTPS/WSS) em qualquer ambiente que não seja localhost de desenvolvimento.
  ❌ Não atendido em nenhum ambiente, incluindo a configuração "produção" do docker-compose (R5). **Ação:** adicionar terminação TLS (reverse proxy) antes de qualquer deploy real.

### Criptografia/proteção em repouso
- **RS09** — Dados pessoais sensíveis (contato, localização) devem ter controle de acesso mesmo dentro do banco/arquivo de armazenamento.
  ⚠️ Parcial — sem criptografia de coluna/arquivo; aceitável para SQLite local de desenvolvimento, mas **ação obrigatória antes de produção**: avaliar criptografia em repouso do banco ou migração para um SGBD gerenciado com criptografia nativa.
- **RS10** — Arquivos de mídia enviados por usuários (fotos de demandas) não devem ser publicamente acessíveis sem autenticação.
  ❌ **Não atendido — alto.** Ver R4. **Ação:** servir `/uploads` atrás de `requireAuth` (ou por URL assinada/temporária).

### Gestão de credenciais e tokens
- **RS11** — Segredos (JWT secret, credenciais de banco/terceiros) nunca devem ter fallback hardcoded funcional no código-fonte.
  ❌ **Não atendido — crítico.** Ver R3. **Ação:** falhar a inicialização do servidor (`throw`) se `JWT_SECRET` não estiver definido, em vez de usar um valor padrão.
- **RS12** — Tokens de sessão no cliente mobile devem ser armazenados em um cofre seguro do sistema operacional.
  ❌ **Não atendido.** `expo-secure-store` já está instalado mas não é usado (ver R2). **Ação:** migrar `authStore`/`session.ts` para `SecureStore`.

## 4. Modelo de autenticação/autorização

### Fluxo atual (as-is)

1. Cidadão preenche cadastro no app → `POST /api/auth/register` (`authController.ts`) — **atualmente aceita `role` do cliente (RS05, falha crítica)**.
2. Backend valida com `zod`, gera hash bcrypt da senha (`authService.ts:28`) e cria o usuário no Prisma.
3. Backend assina um JWT (`{ sub: user.id, role, email }`, `authService.ts:17-21`) usando `env.jwtSecret`, expiração padrão de 7 dias.
4. Token é devolvido de duas formas: (a) no corpo JSON da resposta e (b) em um cookie `httpOnly` (`authController.ts:20-27`).
5. O app mobile guarda `{ user, token }` no Zustand `authStore` persistido via `AsyncStorage` (**texto plano**, RS12) e usa o token via header `Authorization: Bearer` em todas as chamadas subsequentes (`session.ts`).
6. Cada rota protegida passa por `requireAuth` (`authMiddleware.ts:13-41`), que verifica o JWT e recarrega o usuário do banco.
7. Autorização fina (dono da demanda vs. gestor) é feita dentro de `demandService.ts`, não por um middleware de papel reutilizável.

### Modelo alvo (to-be, recomendado)

1. `role` nunca é aceito no `/register` público — todo cadastro começa como `cidadao`; promoção a `gestor` é feita por um fluxo administrativo separado (convite, seed controlado, ou aprovação por um `gestor` existente).
2. `requireRole("gestor")` passa a ser aplicado explicitamente nas rotas que hoje fazem a checagem manualmente, centralizando a regra de autorização.
3. Autorização de `gestor` passa a ser escopada por `organId` (um gestor só acessa/atualiza demandas do seu próprio órgão, salvo um papel adicional de administrador global, se necessário).
4. Token JWT passa a ser guardado no mobile via `expo-secure-store` em vez de `AsyncStorage`.
5. `JWT_SECRET` sem valor definido derruba a inicialização do backend em vez de usar um segredo padrão conhecido.
6. Estudo futuro (Unidade 2 — "Controles de segurança"): refresh token de curta duração + access token de vida curta, para permitir revogação sem esperar a expiração de 7 dias.

## 5. Plano de conformidade com a LGPD

### 5.1 Mapeamento de dados pessoais coletados

| Dado | Onde | Finalidade | Base legal (LGPD) | Retenção atual |
| --- | --- | --- | --- | --- |
| Nome, e-mail, telefone (usuário) | `User` (`schema.prisma`) | Autenticação e identificação do usuário | Execução de contrato / consentimento no cadastro | Indefinida — sem rotina de expurgo |
| Nome, e-mail, telefone do solicitante, endereço, bairro, cidade, referência | `Demand` | Permitir que a gestão pública localize e responda à demanda | Execução de política pública / legítimo interesse | Indefinida |
| Latitude/longitude | `Demand` | Localizar geograficamente o problema relatado | Consentimento explícito no formulário de nova demanda (conforme `docs/old/plano-de-testes.md`, "aceite de compartilhamento de dados") | Indefinida |
| Foto da demanda | `backend/uploads/` | Evidência visual e triagem automática por visão computacional | Consentimento explícito no formulário | Indefinida; **hoje publicamente acessível sem autenticação (R4)** |

### 5.2 Direitos dos titulares

Nenhum endpoint atual permite que um titular exporte, corrija ou solicite exclusão dos seus dados (fora da edição indireta pelo próprio uso do app). **Gaps a endereçar:**
- [ ] Endpoint/rota para o cidadão solicitar exclusão da própria conta e dos dados associados (ou anonimização, quando a demanda precisar ser mantida para fins históricos da gestão pública).
- [ ] Endpoint/rota para exportação dos dados pessoais do titular (portabilidade).

### 5.3 Minimização de dados
- Fotos são armazenadas como recebidas, sem remoção de metadados EXIF (que podem conter GPS, modelo do aparelho, etc., além do campo `latitude`/`longitude` já explícito no formulário). **Ação recomendada:** avaliar remoção de EXIF sensível ao processar o upload, já que a localização já é capturada explicitamente pelo formulário.

### 5.4 Compartilhamento com terceiros
- Fotos podem ser enviadas à API do Google Vision para triagem automática (`GOOGLE_VISION_CREDENTIALS`, `env.ts:40`). Isso configura compartilhamento de dados pessoais (imagem podendo conter pessoas, placas, fachadas) com um operador terceiro. **Ação recomendada:** citar esse compartilhamento explicitamente no termo de consentimento do formulário de nova demanda, e confirmar que o Google Vision está coberto por um acordo de tratamento de dados (DPA) compatível com a LGPD.

### 5.5 Segurança técnica e organizacional
Cobertos na Seção 3 (RS01–RS12). O atendimento a esses requisitos técnicos é parte do dever de segurança da LGPD (art. 46).

### 5.6 Plano de resposta a incidentes (esboço)
1. Qualquer suspeita de vazamento (ex.: exposição de `/uploads`, comprometimento de `JWT_SECRET`) deve ser registrada como issue com label de segurança e tratada com prioridade máxima.
2. Rotacionar `JWT_SECRET` invalida todas as sessões ativas — usar isso como contenção imediata em caso de suspeita de forjamento de token.
3. Registrar data, dados potencialmente afetados e ação tomada, para eventual comunicação à ANPD/titulares conforme exigido pela LGPD em incidentes relevantes.

## 6. Ações recomendadas por prioridade

| Prioridade | Ação | Risco relacionado |
| --- | --- | --- |
| Crítica | Remover `role` do payload aceito por `/register` | R1 |
| Crítica | Remover fallback hardcoded de `JWT_SECRET`; falhar caso não configurado | R3 |
| Alta | Proteger `/uploads` com autenticação (ou URLs assinadas) | R4 |
| Alta | Migrar token do mobile de `AsyncStorage` para `expo-secure-store` | R2 |
| Alta | Definir estratégia de TLS para qualquer ambiente além de localhost | R5 |
| Média | Adicionar rate limiting em `/api/auth/*` | R6 |
| Média | Exigir senha com no mínimo 8 caracteres | R7 |
| Média | Escopar acesso do gestor por `organId` | R8 |
| Média | Adicionar log de auditoria de eventos de autenticação/autorização | R9 |
| Baixa | Formalizar base legal e DPA para envio de fotos ao Google Vision | R10 |

Essas ações se tornam o backlog da entrega **"Controles de segurança (SEG)"** prevista para a Unidade 2 (Semanas 5–7 e 10–13) no quadro de acompanhamento (`docs/sheets/Riscos 5S.html`).
