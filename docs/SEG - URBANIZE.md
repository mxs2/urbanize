# Urbanize — Segurança da Informação (SEG)

**Escopo analisado:** `backend/` (Express + Prisma) e `mobile/` (Expo/React Native)

**Issues de acompanhamento:** [#14](https://github.com/mxs2/urbanize/issues/14) (Unidade 1) e [#27](https://github.com/mxs2/urbanize/issues/27) (Unidade 2)

**Equipe:** Pedro Henrique Rennil da Silva Souza, Janderson José Ferreira da Silva, Jamilla Soares Lobo, Mateus Xavier, Enzo Antuña, Alan Sobral, Pamela Rodrigues, Hyngrid Souza, Diego Xavier, Kayky Dias

| Unidade | Entrega | Tema | Data |
| :---- | :---- | :---- | :---- |
| 1 | 1 | Gestão de autenticação de usuários e gestão de senhas | 28/08 |
| 1 | 2 | Gerenciamento de dados em repouso e anonimização de informações | 11/09 |
| 1 | 3 | Atendimento a requisitos da LGPD | 25/09 |
| 2 | 4 | Disponibilidade e proteção contra ataques digitais | 30/10 |
| 2 | 5 | Backup e continuidade de operação | 20/11 |
| 2 | 6 | Gestão de fornecedores | 11/12 |

**Legenda de status:** Atendido · Parcial · Não atendido

## Contexto

O Urbanize registra demandas urbanas enviadas por cidadãos. Para isso, o sistema coleta dados pessoais: nome, e-mail, telefone, endereço, localização (GPS) e fotos do problema. Esses dados passam do app mobile para o backend e ficam em um banco SQLite (via Prisma). Como o sistema trata dados pessoais com frequência, ele deve cumprir a LGPD (Lei 13.709/2018).

Fizemos esta análise a partir do código-fonte atual. Cada requisito informa o arquivo onde está o problema ou a solução. Assim, as squads SEG e MOB podem conferir e priorizar cada item.

**Última conferência com o código:** 05/11/2026. Todas as evidências de R1 a R13 continuam válidas, exceto R1 e R3, corrigidos em [#49](https://github.com/mxs2/urbanize/issues/49) e [#50](https://github.com/mxs2/urbanize/issues/50). Na conferência, vimos que o teste TC04 confirmava a falha R1: ele esperava que o cadastro público criasse um gestor. O TC04 agora espera a recusa.

## Análise de riscos e ameaças

| ID | Ameaça | Como acontece | Probabilidade | Impacto | Risco | Evidência | Entrega |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| R1 | Usuário comum ganha acesso de gestor | `POST /api/auth/register` aceita o campo `role` enviado pelo cliente | Alta | Alto | **Crítico** — corrigido em [#49](https://github.com/mxs2/urbanize/issues/49) | `backend/src/controllers/authController.ts:13-18`, `backend/src/services/authService.ts:24-31` | 1 |
| R2 | Roubo de sessão | O token JWT fica em `AsyncStorage`, sem criptografia, no celular | Média | Alto | **Alto** | `mobile/src/store/authStore.ts:67`, `mobile/src/services/session.ts:19` | 1 |
| R3 | Criação de tokens falsos | Se `JWT_SECRET` não for definido, o código usa o valor fixo `"urbanize-dev-secret-change-me"` | Baixa (com `.env`) / Alta (sem `.env`) | Alto | **Alto** — corrigido em [#50](https://github.com/mxs2/urbanize/issues/50) | `backend/src/config/env.ts` | 1 |
| R4 | Fotos de demandas expostas | A pasta `/uploads` é pública, sem `requireAuth` | Média | Médio-Alto | **Alto** | `backend/src/app.ts:22` | 2 |
| R5 | Leitura de senhas e dados na rede | Nenhum ambiente usa TLS (HTTPS) | Média | Alto | **Alto** | `docker/docker-compose.yml` (healthcheck e `EXPO_PUBLIC_API_URL` em HTTP) | 4 |
| R6 | Ataque de força bruta no login | Não existe limite de tentativas em `/api/auth/login` e `/api/auth/register` | Média | Médio | **Médio** | `backend/package.json` não tem `express-rate-limit` | 1, 4 |
| R7 | Senhas fracas | `senha: z.string().min(1)` aceita senha de 1 caractere | Alta | Médio | **Médio** | `backend/src/controllers/authController.ts:11` | 1 |
| R8 | Gestor acessa demandas de outro órgão | O acesso do gestor não é limitado ao seu `organId` | Baixa-Média | Médio | **Médio** | `backend/src/services/demandService.ts:39-49` | 1 |
| R9 | Incidentes sem registro | Não há log de login, cadastro ou troca de papel | Média | Médio | **Médio** | `backend/src` não tem biblioteca de log ou auditoria | 3, 4 |
| R10 | Envio de dados pessoais a terceiro sem base legal clara | Fotos podem ir para o Google Vision para triagem | Baixa | Médio | **Baixo-Médio** | `backend/src/config/env.ts:40` (`GOOGLE_VISION_CREDENTIALS`) | 3, 6 |
| R11 | Perda total dos dados | Banco (`dev.db`) e fotos (`uploads/`) ficam em um único disco, sem cópia de segurança | Média | Alto | **Alto** | `backend/.env.example` (`DATABASE_URL="file:./dev.db"`), `backend/src/middlewares/uploadMiddleware.ts:12` | 5 |
| R12 | API fora do ar por excesso de requisições | Sem limite de requisições e sem cabeçalhos de segurança HTTP | Média | Médio | **Médio** | `backend/src/app.ts` não usa `helmet` nem limite de taxa | 4 |
| R13 | Falha ou ataque em pacote de terceiros | Imagens Docker e pacotes npm sem verificação automática de vulnerabilidades | Média | Médio | **Médio** | `docker/docker-compose.yml` (`redis:7-alpine`), `backend/package.json` | 6 |

## Unidade 1

### Entrega 1 — Gestão de autenticação de usuários e gestão de senhas (28/08)

#### Fluxo atual

1. O cidadão preenche o cadastro no app. O app chama `POST /api/auth/register` (`authController.ts`). A rota aceita apenas `role` igual a `cidadao` (RS05). Qualquer outro valor retorna 422.
2. O backend valida os dados com `zod`, gera o hash bcrypt da senha (`authService.ts:28`) e cria o usuário.
3. O backend gera um JWT (`{ sub: user.id, role, email }`, `authService.ts:17-21`) com `env.jwtSecret`. O token vale 7 dias.
4. O backend envia o token de duas formas: no corpo da resposta e em um cookie `httpOnly` (`authController.ts:20-27`).
5. O app guarda `{ user, token }` no `authStore` (Zustand), gravado em `AsyncStorage` **sem criptografia (RS12)**. O app envia o token no header `Authorization: Bearer` em todas as chamadas (`session.ts`).
6. Toda rota protegida passa por `requireAuth` (`authMiddleware.ts:13-41`). Esse middleware valida o JWT e busca o usuário no banco.
7. A regra "dono da demanda ou gestor" está dentro de `demandService.ts`, e não em um middleware reutilizável.

#### Requisitos

**Senhas**

- **RS01** — O sistema deve guardar senhas com hash forte e salt (bcrypt ou argon2). Nunca em texto puro.
  Atendido — `bcryptjs`, custo 10 (`backend/src/services/authService.ts:28,36`).
- **RS02** — A senha deve ter tamanho mínimo e regras básicas de complexidade.
  Não atendido — o mínimo é 1 caractere (`authController.ts:11`). **Ação:** exigir no mínimo 8 caracteres.
- **RS03** — O sistema deve limitar as tentativas de login e cadastro por IP e por conta.
  Não atendido. **Ação:** usar `express-rate-limit` nas rotas `/auth/*`.

**Sessão e tokens**

- **RS04** — O token de sessão deve ter prazo de validade e uma forma segura de renovação.
  Parcial — o prazo é de 7 dias e pode ser configurado (`env.ts:35-36`). Porém, não existe refresh token. Se alguém roubar um token, ele continua válido por até 7 dias, e não há como cancelá-lo.
- **RS11** — Segredos (chave do JWT, senhas de banco e de serviços externos) não podem ter valor padrão no código.
  Atendido para `JWT_SECRET` — o backend não inicia sem a variável e mostra uma mensagem de erro clara ([#50](https://github.com/mxs2/urbanize/issues/50)). `backend/.env.example` e `scripts/setup-env.sh` já definem o valor.
- **RS12** — O app deve guardar o token no cofre seguro do sistema do celular.
  **Não atendido.** O pacote `expo-secure-store` já está instalado, mas não é usado (ver R2). **Ação:** trocar `AsyncStorage` por `SecureStore` em `authStore` e `session.ts`.

**Permissões**

- **RS05** — Somente o servidor pode definir o papel (`role`) do usuário. O cadastro público não pode aceitar esse campo.
  Atendido ([#49](https://github.com/mxs2/urbanize/issues/49)). O cadastro público recusa `role` diferente de `cidadao` com 422, e o repositório sempre grava `cidadao`. O app não mostra mais a opção "Gestor público". Gestores são criados pelo seed (`backend/prisma/seed.ts`). Falta definir um fluxo de convite ou aprovação para novos gestores.
- **RS06** — Toda rota que altera dados de outro usuário deve verificar se quem pede é o dono do dado ou tem o papel certo.
  Atendido para demandas (`demandService.ts:27-36`, `130-131`). Porém, o gestor não fica limitado ao seu `organId` (R8).
- **RS07** — A verificação de papel deve ficar em um único middleware, e não espalhada pelo código.
  Parcial — o middleware `requireRole` existe (`authMiddleware.ts:43-51`), mas nenhuma rota usa. As verificações estão dentro dos services.

#### Modelo proposto

1. Feito: o cadastro público só cria `cidadao`. Falta o fluxo separado para criar `gestor`: convite ou aprovação de um gestor. Hoje, só o seed cria gestores.
2. As rotas de gestor passam a usar `requireRole("gestor")`.
3. O gestor só acessa e altera demandas do seu próprio órgão (`organId`). Se for necessário, criamos um papel de administrador geral.
4. O app guarda o token com `expo-secure-store`.
5. Feito: o backend não inicia sem `JWT_SECRET`.
6. Na Unidade 2, estudar tokens de acesso curtos e refresh token, para cancelar sessões sem esperar 7 dias.

### Entrega 2 — Gerenciamento de dados em repouso e anonimização de informações (11/09)

#### Onde os dados ficam guardados

| Local | O que guarda | Proteção atual |
| :---- | :---- | :---- |
| Banco SQLite (`dev.db`, via Prisma) | Usuários, demandas, histórico, métricas | Nenhuma criptografia. O arquivo está no `.gitignore` e não vai para o repositório. |
| Pasta `backend/uploads/` | Fotos das demandas | Nenhuma criptografia. Acesso público pela rota `/uploads` (R4). |
| `AsyncStorage` no celular | Dados do usuário e token JWT | Sem criptografia (R2). |
| Redis | Cache de métricas (dados agregados, sem dados pessoais) | Sem senha. Porta `6379` aberta no host pelo `docker-compose.yml`. |

#### Requisitos

- **RS09** — Dados pessoais (contato e localização) devem ter controle de acesso também no local onde estão guardados.
  Parcial — não há criptografia de coluna nem de arquivo. Aceitamos isso para o SQLite de desenvolvimento. **Antes de ir para produção, a ação é obrigatória:** criptografar o banco ou migrar para um banco gerenciado com criptografia nativa.
- **RS10** — Fotos enviadas pelos usuários não podem ser públicas.
  **Não atendido — alto.** Ver R4. **Ação:** proteger `/uploads` com `requireAuth` ou usar links assinados e temporários.
- **RS13** — Ao excluir uma conta, o sistema deve anonimizar os dados pessoais das demandas que precisam continuar no histórico da gestão pública.
  Não atendido. Hoje, a exclusão do usuário apenas remove o vínculo (`onDelete: SetNull`, `schema.prisma:111`). Os campos `nomeSolicitante`, `emailSolicitante` e `telefoneSolicitante` continuam na demanda. **Ação:** trocar esses campos por um valor neutro (ex.: `"Anônimo"`) e apagar `telefoneSolicitante`. Manter bairro, categoria e status para as métricas.
- **RS14** — Métricas e relatórios devem usar apenas dados agregados, sem identificar o cidadão.
  Atendido — `MetricsSnapshot` e o cache no Redis guardam apenas totais por status e categoria e o tempo médio de atendimento (`metricsService.ts`).
- **RS15** — O sistema deve apagar metadados EXIF das fotos (GPS, modelo do celular) ao receber o arquivo.
  Não atendido. A foto é salva como chegou (`uploadMiddleware.ts`). **Ação:** remover os metadados EXIF no upload. A localização já vem do formulário.
- **RS16** — O Redis deve exigir senha e não deve ficar exposto fora da rede interna do Docker.
  Não atendido. **Ação:** remover a publicação da porta `6379` fora do ambiente local e configurar `requirepass`.

### Entrega 3 — Atendimento a requisitos da LGPD (25/09)

#### Dados pessoais coletados

| Dado | Onde fica | Finalidade | Base legal (LGPD) | Tempo de guarda atual |
| :---- | :---- | :---- | :---- | :---- |
| Nome, e-mail e telefone do usuário | `User` (`schema.prisma`) | Login e identificação do usuário | Execução de contrato / consentimento no cadastro | Sem prazo. Não há rotina de exclusão. |
| Nome, e-mail e telefone do solicitante, endereço, bairro, cidade e referência | `Demand` | Permitir que a gestão pública encontre o local e responda à demanda | Execução de política pública / legítimo interesse | Sem prazo |
| Latitude e longitude | `Demand` | Localizar o problema no mapa | Consentimento explícito no formulário de nova demanda (`docs/old/plano-de-testes.md`, "aceite de compartilhamento de dados") | Sem prazo |
| Foto da demanda | `backend/uploads/` | Mostrar o problema e fazer a triagem automática | Consentimento explícito no formulário | Sem prazo. **Hoje é pública (R4).** |

#### Direitos dos titulares (art. 18)

Hoje, nenhuma rota permite que o cidadão exporte, corrija ou exclua seus dados. **O que falta:**

- **RS17** — Rota para o cidadão excluir a própria conta e os dados ligados a ela. Para demandas que precisam ficar no histórico, aplicar a anonimização do RS13.
- **RS18** — Rota para o cidadão baixar uma cópia dos seus dados pessoais (portabilidade).
- **RS19** — Tela no app para o cidadão corrigir nome, e-mail e telefone.

#### Minimização e prazo de guarda

- **RS20** — Definir por quanto tempo guardar cada dado. Proposta: anonimizar os dados de contato da demanda 12 meses após o status final (resolvida ou cancelada). Usar uma tarefa agendada com `node-cron`, que o backend já usa (`backend/src/config/cron.ts`).
- A remoção de EXIF (RS15) também reduz dados coletados sem necessidade.

#### Compartilhamento com terceiros

- O backend pode enviar fotos para a API do Google Vision (`GOOGLE_VISION_CREDENTIALS`, `env.ts:40`). A foto pode mostrar pessoas, placas de carro e fachadas. Isso é compartilhamento de dados pessoais com um operador externo. **Ação:** informar esse envio no termo de consentimento do formulário de nova demanda. Confirmar que o contrato do Google Cloud inclui um acordo de tratamento de dados (DPA) compatível com a LGPD. Mais detalhes na Entrega 6.

#### Segurança técnica (art. 46)

Os requisitos RS01 a RS16 das Entregas 1 e 2 fazem parte do dever de segurança da LGPD.

#### Resposta a incidentes (art. 48)

1. Toda suspeita de vazamento (ex.: fotos expostas em `/uploads`, `JWT_SECRET` descoberto) vira uma issue com a label de segurança e recebe prioridade máxima.
2. Para conter um token falso, trocar o `JWT_SECRET`. Isso encerra todas as sessões ativas.
3. Registrar a data, os dados que podem ter sido afetados e a ação tomada. Esse registro serve para comunicar a ANPD e os titulares, quando a LGPD exigir.
4. **RS21** — Criar log de auditoria para login, cadastro, troca de papel e exclusão de conta (R9). Sem esse log, não é possível saber o que aconteceu em um incidente.

## Unidade 2

### Entrega 4 — Disponibilidade e proteção contra ataques digitais (30/10)

#### O que já existe

- O `docker-compose.yml` reinicia os serviços após falhas (`restart: unless-stopped`) e verifica a saúde da API em `/api/health`.
- Se o Redis cair, a API continua funcionando sem cache (`backend/src/config/redis.ts`).
- O upload aceita apenas imagens de até 10 MB (`uploadMiddleware.ts:21-33`).
- Em produção, o CORS aceita apenas as origens listadas em `FRONTEND_URL` (`env.ts`).

#### Requisitos

- **RS08** — Toda comunicação entre o app e o backend deve usar TLS (HTTPS), exceto em `localhost` de desenvolvimento.
  Não atendido em nenhum ambiente (R5). **Ação:** colocar um proxy reverso com TLS (ex.: Nginx ou Caddy) na frente da API antes de qualquer publicação.
- **RS03** (ver Entrega 1) — Limitar tentativas nas rotas `/auth/*`.
- **RS22** — Limitar o número de requisições por IP em toda a API, com limite menor nas rotas de upload.
  Não atendido (R12). **Ação:** usar `express-rate-limit`. Com várias instâncias, guardar os contadores no Redis.
- **RS23** — Enviar cabeçalhos de segurança HTTP (ex.: `X-Content-Type-Options`, `Strict-Transport-Security`).
  Não atendido. **Ação:** usar `helmet` em `app.ts`.
- **RS24** — Validar todos os dados de entrada e limitar o tamanho do corpo das requisições.
  Atendido — as rotas validam com `zod`. `express.json()` usa o limite padrão de 100 KB.
- **RS25** — Monitorar a disponibilidade da API e avisar a equipe quando ela cair.
  Não atendido. **Ação:** usar um serviço externo que chame `/api/health` a cada minuto e envie alerta.

### Entrega 5 — Backup e continuidade de operação (20/11)

#### Situação atual

Todos os dados do sistema ficam em dois lugares: o arquivo `dev.db` e a pasta `backend/uploads/`. Os dois estão no mesmo disco e não têm cópia de segurança. O `.gitignore` exclui os arquivos `*.db`, então o repositório também não guarda uma cópia (e não deve guardar, porque contém dados pessoais). Se o disco falhar, perdemos todas as demandas e fotos (R11).

#### Metas

| Meta | Valor proposto | Significado |
| :---- | :---- | :---- |
| RPO (perda máxima de dados) | 24 horas | Em uma falha, perdemos no máximo os dados do último dia. |
| RTO (tempo máximo para voltar a funcionar) | 4 horas | A equipe deve colocar o sistema no ar em até 4 horas. |

#### Requisitos

- **RS26** — Fazer backup diário do banco com o comando `sqlite3 dev.db ".backup ..."`. Esse comando copia o banco com segurança mesmo com a API ligada.
- **RS27** — Fazer backup diário da pasta `uploads/`.
- **RS28** — Guardar os backups fora do servidor principal (ex.: armazenamento em nuvem em outra região), com criptografia.
- **RS29** — Manter os backups diários por 7 dias e os semanais por 4 semanas. Backups também contêm dados pessoais e seguem as regras da Entrega 3.
- **RS30** — Testar a restauração de um backup uma vez por mês e registrar o resultado. Backup que nunca foi testado não garante nada.
- **RS31** — Escrever um roteiro de recuperação: quem age, em que ordem, e quais comandos usar para subir o sistema a partir do backup. O `docker-compose.yml` já permite recriar a API e o Redis. O Redis guarda apenas cache e não precisa de backup.

### Entrega 6 — Gestão de fornecedores (11/12)

#### Fornecedores e serviços externos

| Fornecedor | Uso no Urbanize | Recebe dados pessoais? | Risco se falhar |
| :---- | :---- | :---- | :---- |
| Google Cloud (Vision API) | Triagem automática das fotos | Sim (fotos) | A triagem para. A demanda continua sendo registrada. |
| Expo | Build e execução do app mobile | Não diretamente | Bloqueia novas versões do app. |
| GitHub | Código-fonte, issues e revisão | Não (dados reais não vão para o repositório) | Bloqueia o desenvolvimento. |
| npm (pacotes do backend e do mobile) | Bibliotecas como `express`, `prisma`, `jsonwebtoken`, `multer` | Não diretamente | Um pacote com falha ou malicioso pode comprometer a API (R13). |
| Docker Hub | Imagem `redis:7-alpine` e imagens base | Não | Falha no build ou imagem vulnerável. |

#### Requisitos

- **RS32** — Manter esta lista de fornecedores atualizada. Para cada fornecedor, registrar: responsável na equipe, dados enviados, contrato e plano de saída.
- **RS33** — Para todo fornecedor que recebe dados pessoais, confirmar que o contrato inclui acordo de tratamento de dados (DPA) compatível com a LGPD. Informar o compartilhamento no termo de consentimento. Hoje, isso vale para o Google Vision (R10).
- **RS34** — Enviar ao fornecedor apenas o necessário. Para o Google Vision, enviar só a foto, sem EXIF (RS15) e sem nome ou contato do cidadão.
- **RS35** — Verificar vulnerabilidades nas dependências de forma automática. **Ação:** ativar o Dependabot no GitHub e rodar `npm audit` no CI. Manter os arquivos `package-lock.json` no repositório.
- **RS36** — Usar versões fixas das imagens Docker (tag exata ou digest), e não tags genéricas como `redis:7-alpine`.
- **RS37** — Definir um plano de saída para cada fornecedor importante. Exemplo: se o Google Vision ficar indisponível ou mudar o contrato, a demanda deve seguir para triagem manual pelo gestor.

## Ações por prioridade

| Prioridade | Ação | Requisito | Risco | Entrega |
| :---- | :---- | :---- | :---- | :---- |
| Crítica | Remover `role` do cadastro público — **feito** ([#49](https://github.com/mxs2/urbanize/issues/49)) | RS05 | R1 | 1 |
| Crítica | Remover o valor padrão de `JWT_SECRET`. O servidor não inicia sem ele. — **feito** ([#50](https://github.com/mxs2/urbanize/issues/50)) | RS11 | R3 | 1 |
| Alta | Proteger `/uploads` com login ou links assinados | RS10 | R4 | 2 |
| Alta | Guardar o token do app em `expo-secure-store` | RS12 | R2 | 1 |
| Alta | Usar TLS em todo ambiente fora do `localhost` | RS08 | R5 | 4 |
| Alta | Criar backup diário do banco e das fotos, com teste de restauração | RS26–RS30 | R11 | 5 |
| Média | Limitar tentativas em `/api/auth/*` e requisições em toda a API | RS03, RS22 | R6, R12 | 1, 4 |
| Média | Exigir senha com no mínimo 8 caracteres | RS02 | R7 | 1 |
| Média | Limitar o gestor ao seu `organId` | RS06 | R8 | 1 |
| Média | Anonimizar demandas ao excluir conta | RS13, RS17 | — | 2, 3 |
| Média | Criar log de auditoria de login, cadastro e troca de papel | RS21 | R9 | 3 |
| Média | Ativar Dependabot e `npm audit` | RS35 | R13 | 6 |
| Baixa | Formalizar base legal e DPA para envio de fotos ao Google Vision | RS33 | R10 | 3, 6 |
| Baixa | Adicionar `helmet` e monitoramento externo de disponibilidade | RS23, RS25 | R12 | 4 |

Estas ações formam o backlog de "Controles de segurança (SEG)" da Unidade 2. O quadro de acompanhamento está em `docs/sheets/Riscos 5S.html`.
