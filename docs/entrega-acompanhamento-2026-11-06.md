# Entrega Acompanhamento 2026/11/06

Detalha como cada critério do acompanhamento foi implementado no Urbanize, onde está o código e como foi verificado.

**Legenda:** ✅ completo

## Resumo

| # | Critério | Status |
| --- | --- | --- |
| 1 | Estado global com Zustand (`authStore` e `demandStore`) | ✅ |
| 2 | Integração com o backend: `signup`, `login`, `logout` e perfis (Cidadão e Gestor Público) | ✅ |
| 3 | Persistência de sessão, JWT nas requisições e proteção de rotas privadas | ✅ |
| 4 | CRUD de demandas integrado à API REST real, com persistência em banco | ✅ |

Arquitetura em uma linha: **tela (Expo Router) → store (Zustand) → service → `api.ts` (axios) → API Express → Prisma → SQLite**.

## 1. Gerenciamento de estado global (Zustand)

Os stores ficam em [`mobile/src/store/`](../mobile/src/store).

### `authStore` — [`authStore.ts`](../mobile/src/store/authStore.ts)

| Estado | Para que serve |
| --- | --- |
| `user` | Usuário logado (`id`, `nome`, `email`, `role`) |
| `token` | JWT da sessão |
| `loading` | Evita duplo envio de login/cadastro |
| `hydrated` | Indica que a sessão salva já foi lida do dispositivo; as telas só decidem redirecionar depois disso |

Ações: `login`, `register` e `logout`. O store usa o middleware `persist` (ver item 3).

### `demandStore` — [`demandStore.ts`](../mobile/src/store/demandStore.ts)

Estado: `demands`, `bairros`, `selected`, `filters`, `loading` e `error`.

| Ação | Operação |
| --- | --- |
| `fetchDemands(filters)` | Lista com filtros |
| `fetchDemandById(id)` | Detalhe |
| `createDemand(payload)` | Criação |
| `updateDemand(id, payload)` | Edição (novo) |
| `deleteDemand(id)` | Exclusão (novo) |
| `updateDemandStatus(id, status, obs)` | Mudança de status pelo gestor |
| `setFilters` / `clearFilters` | Filtros da listagem |

Depois de cada operação o store atualiza a lista e o item selecionado localmente, sem recarregar tudo.

Há também o `uiStore.ts` para estado de interface.

## 2. Integração com o backend: cadastro, login, logout e perfis

### Fluxo

1. A tela [`cadastro.tsx`](../mobile/app/cadastro.tsx) ou [`login.tsx`](../mobile/app/login.tsx) chama `useAuth()`, que expõe o `authStore`.
2. O store chama `authService`, que chama `api.register` ou `api.login` em [`api.ts`](../mobile/src/services/api.ts).
3. O backend responde `{ success, data: { user, token } }`. O store guarda os dois.

### Endpoints

| Rota | Função | Código no backend |
| --- | --- | --- |
| `POST /api/auth/register` | Cadastro; recusa e-mail repetido (409) | [`authService.ts`](../backend/src/services/authService.ts) |
| `POST /api/auth/login` | Autenticação; erro genérico "Credenciais inválidas" (401) | idem |
| `GET /api/auth/me` | Dados do usuário do token | [`authController.ts`](../backend/src/controllers/authController.ts) |
| `POST /api/auth/logout` | Limpa o cookie de sessão | idem |

Senhas são gravadas com **bcrypt** (hash com 10 rounds). Nunca trafegam de volta ao cliente.

### Perfis

O campo `role` aceita `cidadao` (padrão) e `gestor`. O cadastro do app tem um seletor de perfil.

O perfil vale nas duas pontas:

- **Backend** ([`demandService.ts`](../backend/src/services/demandService.ts)): cidadão só enxerga e altera as próprias demandas; só o gestor altera o status ou mexe em qualquer demanda.
- **Mobile**: o menu muda por perfil (Início, Minhas demandas e Nova demanda para o cidadão; Painel e Demandas para o gestor) em [`(app)/_layout.tsx`](../mobile/app/(app)/_layout.tsx).

### Logout

`logout` chama `POST /auth/logout`, apaga o token da memória, limpa o estado do store (o que apaga também o armazenamento persistido) e volta para `/login`. Se o servidor estiver inacessível, o logout local acontece mesmo assim.

## 3. Persistência de sessão, JWT e rotas protegidas

### Persistência

- O `persist` do Zustand grava `user` e `token` no **AsyncStorage** (chave `urbanize-auth`). Ao abrir o app, a sessão é restaurada e `hydrated` passa a `true`.
- O token vive também **em memória** em [`session.ts`](../mobile/src/services/session.ts). O login o grava de forma síncrona, porque o AsyncStorage é assíncrono e a primeira requisição depois do login poderia sair sem token.

### JWT nas requisições

O interceptor de requisição do axios ([`api.ts`](../mobile/src/services/api.ts)) lê o token e envia `Authorization: Bearer <token>` em toda chamada.

No backend, o middleware [`requireAuth`](../backend/src/middlewares/authMiddleware.ts) verifica a assinatura e a validade do JWT, confirma que o usuário ainda existe e preenche `req.user`. Ele protege todas as rotas de `/api/demands`, `/api/metrics`, `/api/upload` e `/auth/me`. O token também é emitido como cookie `httpOnly`, e o middleware aceita cookie ou Bearer.

### Proteção de rotas no app

| Camada | Comportamento |
| --- | --- |
| Layout privado ([`(app)/_layout.tsx`](../mobile/app/(app)/_layout.tsx)) | Sem usuário depois da hidratação, redireciona para `/login`. Toda tela dentro de `(app)` fica protegida. |
| [`useRoleGuard`](../mobile/src/hooks/useRoleGuard.ts) | Cada tela declara os perfis aceitos. Cidadão em tela de gestor (e vice-versa) é enviado à própria página inicial. |

### Novo nesta entrega: sessão expirada e revalidação

Dois pontos que antes ficavam abertos:

1. **Tratamento de 401.** Um interceptor de resposta em `api.ts` detecta `401` em qualquer rota autenticada e aciona o logout automático; o layout privado então leva o usuário ao login. As rotas `/auth/login`, `/auth/register` e `/auth/logout` são excluídas, porque nelas o 401 significa "credenciais erradas", não "sessão expirada". Para evitar dependência circular, o `authStore` registra o tratador via `setUnauthorizedHandler` em `session.ts`.
2. **Revalidação ao abrir o app.** Depois de restaurar a sessão, o `authStore` chama `GET /auth/me`. Se o token expirou, o interceptor encerra a sessão. Se a resposta for válida, o usuário é atualizado (ex.: mudança de perfil). Falha de rede mantém a sessão local, para o app não deslogar offline.

## 4. CRUD de demandas com a API REST real

Não há dados mockados: o `demandStore` chama o `demandService`, que chama a API. O arquivo `mockDelay.ts`, que não era usado, foi removido.

### Endpoints

Todos exigem autenticação. Código em [`demandRoutes.ts`](../backend/src/routes/demandRoutes.ts), [`demandController.ts`](../backend/src/controllers/demandController.ts), [`demandService.ts`](../backend/src/services/demandService.ts) e [`demandRepository.ts`](../backend/src/repositories/demandRepository.ts).

| Operação | Rota | Regra |
| --- | --- | --- |
| **C**reate | `POST /api/demands` | Gera protocolo `URB-xxxxx`, faz a triagem (órgão responsável sugerido) e registra o histórico inicial |
| **R**ead (lista) | `GET /api/demands` | Filtros: `status`, `categoria`, `prioridade`, `bairro`, `busca`. Cidadão vê só as suas; gestor vê todas |
| **R**ead (detalhe) | `GET /api/demands/:id` | 404 se não existe; 403 se for de outro cidadão |
| **U**pdate | `PATCH /api/demands/:id` | **Novo.** Edita título, descrição, categoria, prioridade, telefone, endereço e imagem. Exige ao menos um campo (422). Registra "Demanda editada" no histórico |
| **U**pdate (status) | `PATCH /api/demands/:id/status` | Só gestor; grava a observação e uma linha no histórico |
| **D**elete | `DELETE /api/demands/:id` | **Novo.** Remove a demanda; o histórico vai junto (`onDelete: Cascade`) |

**Regra de negócio das novas rotas:** o cidadão só edita ou exclui a **própria** demanda e **só enquanto estiver `registrada` ou `em_analise`**. Depois que a prefeitura começa a tratar, a API responde `409 DEMAND_LOCKED`. O gestor pode editar e excluir qualquer demanda. Toda alteração invalida o cache das métricas.

### No app

A tela de detalhe ([`demandas/[id].tsx`](../mobile/app/(app)/demandas/[id].tsx)) ganhou o botão **Excluir demanda**, com confirmação. Ele só aparece quando a regra do backend permite, e a lista é atualizada ao voltar. As funções de edição (`updateDemand`) estão no store e no `api.ts`, prontas para uma tela de edição.

### Banco de dados

Persistência com **Prisma + SQLite** ([`schema.prisma`](../backend/prisma/schema.prisma)): `User`, `Demand`, `DemandHistory`, `Organ` e `MetricsSnapshot`, com migrations versionadas e seed de demonstração.

## Verificação

| Suíte | Resultado |
| --- | --- |
| Backend, API (`backend`, `npm test`) | 77 testes passando, incluindo os 7 novos de edição/exclusão |
| Mobile, unitários (`mobile`, `npm test`) | 13 testes passando, incluindo 2 novos do interceptor de 401 |
| `tsc --noEmit` no backend e no mobile | Sem erros |

Testes adicionados:

- [`tests/acceptance/07_demands_update_delete.test.ts`](../tests/acceptance/07_demands_update_delete.test.ts): edição com histórico; payload vazio (422); acesso a demanda alheia (403); demanda em atendimento (409); exclusão pelo dono (e depois 404); exclusão pelo gestor; exigência de autenticação (401).
- [`tests/unit/services/api.test.ts`](../tests/unit/services/api.test.ts): o 401 em rota autenticada aciona o logout; o 401 do login não aciona.

Não foram executados os testes E2E (Playwright) nem o app em um dispositivo ou emulador.

## Limitações conhecidas

- **Perfil no cadastro.** Qualquer pessoa pode se cadastrar como `gestor` pelo seletor. Serve à demonstração; em produção, o perfil de gestor deveria ser concedido por um administrador ou por convite.
- **Logout stateless.** O JWT não é invalidado no servidor; ele só deixa de ser usado no cliente e expira sozinho (padrão de 7 dias).
- **Edição sem tela.** A API e o store de edição existem e estão testados, mas o app ainda não tem formulário de edição.
