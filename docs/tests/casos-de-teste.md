# Casos de Teste — Urbanize

Complementa o [plano de testes](plano-de-testes.md). Casos derivados do código atual
(`backend/src` e `mobile/app`), não só da especificação — onde o comportamento do código
diverge do esperado pelo negócio, o caso está marcado com **⚠ provável defeito**.

**Massa de dados (seed):** `cidadao@urbanize.com` / `demo` (cidadão) · `gestor@urbanize.com` / `demo` (gestor) ·
órgãos EMLURB, SEINFRA, Neoenergia, Compesa, Sec. Controle Urbano.

**Legenda:** Tipo — `API` (Jest + Supertest), `UI` (RNTL/Playwright), `Manual` (aparelho físico).
Prio — P0 bloqueia release, P1 importante, P2 desejável.

---

## 1. Autenticação e cadastro

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-AUTH-01 | Login válido de cidadão | Seed carregado | `POST /api/auth/login` com `cidadao@urbanize.com`/`demo` | 200; `data.user.role = "cidadao"`; `data.token` JWT; cookie httpOnly definido | API | P0 |
| CT-AUTH-02 | Login válido de gestor | Seed carregado | Login com `gestor@urbanize.com`/`demo` | 200; `role = "gestor"`; app redireciona para `/gestor` | API/UI | P0 |
| CT-AUTH-03 | Senha incorreta | — | Login com email válido e senha errada | 401 `INVALID_CREDENTIALS`, mensagem "Credenciais inválidas." | API | P0 |
| CT-AUTH-04 | Email inexistente | — | Login com email não cadastrado | 401 `INVALID_CREDENTIALS` com a **mesma** mensagem do CT-AUTH-03 (não revela se o email existe) | API | P0 |
| CT-AUTH-05 | Email malformado / senha vazia | — | Login com `email: "abc"` ou `senha: ""` | 400 de validação; nenhum token emitido | API | P1 |
| CT-AUTH-06 | Erro de login na tela | App aberto em `/login` | Informar credenciais inválidas e tocar "Entrar" | Alerta "Erro ao entrar"; permanece em `/login`; botão sai do estado loading | UI | P1 |
| CT-AUTH-07 | Cadastro de cidadão | — | `POST /api/auth/register` com nome, email novo, senha, telefone | 201; usuário criado com `role = "cidadao"`; senha armazenada como hash bcrypt (nunca em texto) | API | P0 |
| CT-AUTH-08 | Cadastro com email duplicado | Usuário já existe | Registrar com mesmo email | 409 `EMAIL_ALREADY_EXISTS` | API | P0 |
| CT-AUTH-09 | Cadastro com nome curto | — | `nome: "A"` | 400 (mínimo 2 caracteres) | API | P2 |
| CT-AUTH-10 | Autocadastro como gestor | — | `POST /api/auth/register` com `role: "gestor"` | **Esperado:** 400/403 — perfil gestor só criado por administrador. **⚠ provável defeito:** o schema aceita `role` do corpo e a tela de cadastro expõe o campo "Perfil"; qualquer pessoa vira gestor e pode alterar status de todas as demandas | API | P0 |
| CT-AUTH-11 | `/me` com sessão válida | Logado | `GET /api/auth/me` | 200 com dados públicos do usuário, **sem** `senhaHash` | API | P0 |
| CT-AUTH-12 | Rota protegida sem token | — | `GET /api/demands` sem cookie nem header | 401 `UNAUTHENTICATED` | API | P0 |
| CT-AUTH-13 | Token adulterado / expirado | — | Enviar `Authorization: Bearer <token com assinatura inválida>`; repetir com token expirado | 401 `INVALID_TOKEN` | API | P0 |
| CT-AUTH-14 | Token de usuário excluído | Token válido, usuário removido do banco | `GET /api/demands` | 401 `UNAUTHENTICATED` | API | P1 |
| CT-AUTH-15 | Logout | Logado | Tocar sair / `POST /api/auth/logout`; chamar rota protegida | Cookie limpo; próxima chamada sem Bearer retorna 401; app volta para `/login` | API/UI | P1 |
| CT-AUTH-16 | Sessão persistida | Logado | Fechar e reabrir o app | Usuário continua logado e cai na rota padrão do perfil | UI | P2 |

## 2. Controle de acesso por perfil

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-ACL-01 | Cidadão tenta alterar status | Logado como cidadão, demanda própria | `PATCH /api/demands/:id/status` | 403 "Somente gestores podem alterar status." | API | P0 |
| CT-ACL-02 | Cidadão acessa demanda de outro cidadão | Demanda criada por outro usuário | `GET /api/demands/:id` | 403 `FORBIDDEN` | API | P0 |
| CT-ACL-03 | Cidadão lista demandas | Existem demandas de vários usuários | `GET /api/demands` | Retorna **apenas** demandas com `userId` do cidadão logado | API | P0 |
| CT-ACL-04 | Cidadão tenta burlar filtro | — | `GET /api/demands?userId=<outro>` | Parâmetro ignorado; continua vendo só as próprias | API | P1 |
| CT-ACL-05 | Gestor lista demandas | Demandas de vários cidadãos | `GET /api/demands` | Retorna todas as demandas | API | P0 |
| CT-ACL-06 | Demanda inexistente | — | `GET /api/demands/id-invalido` | 404 `DEMAND_NOT_FOUND` | API | P1 |
| CT-ACL-07 | Cidadão abre `/gestor` | Logado como cidadão | Navegar para `/gestor` | `useRoleGuard` redireciona para rota padrão do cidadão | UI | P1 |
| CT-ACL-08 | Gestor abre `/demandas/nova` | Logado como gestor | Navegar para `/demandas/nova` | Redirecionado para `/gestor`; botão "Nova demanda" não aparece na listagem | UI | P1 |
| CT-ACL-09 | Não logado abre rota interna | Sem sessão | Abrir `/demandas` | Redirecionado para `/login` | UI | P1 |
| CT-ACL-10 | Abas por perfil | — | Logar como cidadão, depois como gestor | Cada perfil vê somente suas abas (`CIDADAO_LINKS` vs `GESTOR_LINKS`) | UI | P2 |

## 3. Cidadão — Registrar demanda

### 3.1 Foto e triagem automática

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-FOTO-01 | Foto pela câmera | Permissão de câmera concedida | Tocar em fotografar, tirar foto | Preview exibido; upload enviado; categoria e título preenchidos pela triagem | Manual | P0 |
| CT-FOTO-02 | Foto da galeria | Permissão de galeria concedida | Escolher imagem da galeria | Mesmo comportamento do CT-FOTO-01 | UI | P0 |
| CT-FOTO-03 | Permissão de câmera negada | — | Negar permissão | Alerta "Permissão necessária"; formulário continua utilizável sem foto | Manual | P1 |
| CT-FOTO-04 | Permissão de galeria negada | — | Negar permissão | Alerta "Permissão necessária" | Manual | P1 |
| CT-FOTO-05 | Seleção cancelada | — | Abrir câmera/galeria e cancelar | Nada muda; sem erro, sem preview | UI | P2 |
| CT-FOTO-06 | Upload JPEG/PNG/WebP | Logado | `POST /api/upload/image` com campo `imagem` | 200; `data.imageUrl = /uploads/<arquivo>`; `data.triagem` com `categoria`, `score`, `labels` | API | P0 |
| CT-FOTO-07 | Upload sem arquivo | Logado | POST sem campo `imagem` | 400 `NO_FILE` | API | P1 |
| CT-FOTO-08 | Formato não suportado | Logado | Enviar PDF ou `.txt` | 400 `INVALID_FILE_TYPE`; nada gravado em `uploads/` | API | P1 |
| CT-FOTO-09 | Arquivo acima de 10 MB | Logado | Enviar imagem de 11 MB | Rejeitado com erro 4xx claro (limite do multer); app mostra "Erro ao processar imagem" | API | P1 |
| CT-FOTO-10 | Upload sem autenticação | — | POST sem token | 401 | API | P0 |
| CT-FOTO-11 | Arquivo disfarçado | Logado | Enviar `.exe` com `Content-Type: image/png` | **Esperado:** rejeitado. **⚠ provável defeito:** filtro confia só no mimetype do cliente | API | P1 |
| CT-FOTO-12 | Nome de arquivo com path traversal | Logado | `originalname = "../../x.png"` | Arquivo salvo com nome gerado (`<timestamp>-<rand>.png`) dentro de `uploads/` | API | P1 |
| CT-FOTO-13 | Falha de rede no upload | API fora do ar | Selecionar foto | Alerta "Erro ao processar imagem"; spinner some | UI | P1 |

### 3.2 Classificação (visionService)

Google Vision mockado com `nock` / mock do `ImageAnnotatorClient`.

| ID | Cenário | Labels retornados | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- |
| CT-VIS-01 | Buraco na via | `["Pothole", "Asphalt"]` | `vias_publicas`, score 0.8 (0.6 + 2×0.1) | API | P0 |
| CT-VIS-02 | Poste / fiação | `["Street light"]` | `iluminacao_publica` | API | P1 |
| CT-VIS-03 | Lixo acumulado | `["Garbage", "Waste", "Litter"]` | `coleta_de_lixo`, score 0.9 | API | P1 |
| CT-VIS-04 | Alagamento | `["Flood"]` | `saneamento` | API | P1 |
| CT-VIS-05 | Pichação | `["Graffiti"]` | `fiscalizacao` | API | P1 |
| CT-VIS-06 | Mato alto | `["Overgrown", "Grass"]` | `zeladoria` | API | P1 |
| CT-VIS-07 | Nada reconhecido | `["Cat"]` | `outros`, score 0.45 | API | P0 |
| CT-VIS-08 | Score máximo | 5+ keywords da mesma categoria | Score limitado a 0.98 | API | P2 |
| CT-VIS-09 | Labels ambíguos | `["Street", "Light"]` | Ganha a primeira categoria do `LABEL_MAP` (`vias_publicas`) — documentar como regra | API | P2 |
| CT-VIS-10 | Vision não configurado + categoria do app | Sem `googleCredentials`, body `categoria=saneamento` | `saneamento`, score 0.75, `labels: []` | API | P0 |
| CT-VIS-11 | Vision não configurado sem categoria | Sem credenciais, sem `categoria` | `outros`, score 0.5 | API | P1 |
| CT-VIS-12 | Vision fora do ar / sem crédito | Mock lança erro | **Esperado:** fallback para categoria do app ou `outros`. **⚠ provável defeito:** erro não é tratado em `triarImagem`, upload retorna 500 e a imagem fica órfã em disco | API | P0 |
| CT-VIS-13 | Categoria inválida do app | Sem credenciais, `categoria=xyz` | **Esperado:** 400 ou `outros`. Hoje o valor passa sem validação | API | P2 |

### 3.3 Formulário e envio

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-DEM-01 | Registro completo com foto e GPS | Cidadão logado, permissões concedidas | Foto, descrição, capturar localização, marcar aceite, "Registrar demanda" | 201; alerta "Demanda registrada — Protocolo URB-XXXXX"; navega para detalhe | UI/API | P0 |
| CT-DEM-02 | Registro sem foto | Cidadão logado | Preencher título, descrição, endereço, aceite | Demanda criada com categoria selecionada (padrão `outros`), sem `imagemUrl` | UI | P1 |
| CT-DEM-03 | Sem aceite de compartilhamento | Formulário preenchido | Não marcar `checkbox-aceite`, enviar | Alerta "Confirme o aceite"; nenhuma requisição enviada | UI | P0 |
| CT-DEM-04 | Campos obrigatórios vazios | Aceite marcado | Deixar título, descrição ou endereço vazio (ou só espaços) | Alerta "Campos obrigatórios"; nenhuma requisição | UI | P0 |
| CT-DEM-05 | Validação na API | Logado | POST com `titulo` < 3, `descricao` < 5 ou `endereco.endereco` < 3 | 400 com erro de validação por campo | API | P0 |
| CT-DEM-06 | Categoria/prioridade inválidas | Logado | POST com `categoria: "xyz"` | 400 | API | P1 |
| CT-DEM-07 | Email solicitante inválido | Logado | `emailSolicitante: "abc"` | 400 | API | P2 |
| CT-DEM-08 | Valores padrão | Logado | POST só com obrigatórios | `prioridade = media`, `bairro = "Não informado"`, `cidade = "Recife"`, `origem = cidadao`, nome/email do usuário logado | API | P1 |
| CT-DEM-09 | Estado inicial e histórico | Logado | Criar demanda | `status = em_analise`; histórico com 2 entradas em ordem: `registrada` (autor = cidadão) e `em_analise` "Triagem automática: <órgão>" (autor = Sistema) | API | P0 |
| CT-DEM-10 | Protocolo | — | Criar várias demandas | Formato `URB-` + 5 dígitos; único (constraint `@unique`) | API | P1 |
| CT-DEM-11 | Encaminhamento sugerido | Órgãos no seed | Criar demanda de cada categoria | `sugestaoEncaminhamento` = nome do órgão que atende a categoria; sem órgão, usa mapa estático (ex.: `outros` → "Central de Atendimento") | API | P0 |
| CT-DEM-12 | Score da triagem na demanda | Upload retornou score 0.95 | Criar demanda com a `imagemUrl` do upload | **Esperado:** `scoreTriagem` reflete a triagem da imagem. **⚠ provável defeito:** o service grava fixo 0.82 (ou 0.55 para `outros`), ignorando o score real | API | P1 |
| CT-DEM-13 | Sugestão de órgão na tela | Categoria com órgão cadastrado | Trocar categoria | Card do órgão com WhatsApp/Email/Site; título e descrição sugeridos se ainda vazios | UI | P2 |
| CT-DEM-14 | Foto após digitar título | Título já digitado | Anexar foto | Definir regra: hoje a triagem **sobrescreve** o título digitado pelo cidadão | UI | P2 |
| CT-DEM-15 | Duplo toque em "Registrar" | Formulário válido | Tocar 2× rápido | Apenas 1 demanda criada (botão em loading bloqueia) | UI | P1 |
| CT-DEM-16 | Erro de rede no envio | API fora do ar | Enviar | Alerta "Erro"; dados do formulário preservados | UI | P1 |
| CT-DEM-17 | Cancelar | Formulário parcialmente preenchido | Tocar "Cancelar" | Volta para `/demandas`; nada criado | UI | P2 |
| CT-DEM-18 | Injeção/XSS em campos texto | Logado | Título `<script>alert(1)</script>`, descrição com `'; DROP TABLE` | Salvo como texto literal; exibido sem execução na lista, detalhe e painel | API/UI | P1 |
| CT-DEM-19 | Cache de métricas | Métricas já em cache | Criar demanda; `GET /api/metrics/summary` | Total incrementado (chave `metrics:summary:all` invalidada) | API | P1 |

### 3.4 Localização

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-LOC-01 | Capturar GPS | Permissão concedida | Tocar em capturar localização | Coordenadas exibidas; endereço, bairro e cidade preenchidos pelo geocoding reverso | Manual | P0 |
| CT-LOC-02 | Permissão negada | — | Negar permissão | Alerta "Permissão necessária"; endereço pode ser digitado manualmente | Manual | P1 |
| CT-LOC-03 | GPS desligado / sem sinal | Localização do aparelho desligada | Capturar | Alerta "Erro ao localizar"; spinner some | Manual | P1 |
| CT-LOC-04 | Remover coordenadas | Coordenadas capturadas | Tocar "Remover" | Coordenadas limpas; demanda enviada sem latitude/longitude | UI | P2 |
| CT-LOC-05 | Persistência | Coordenadas capturadas | Registrar e abrir detalhe | `latitude`/`longitude` gravados; endereço formatado no detalhe | API/UI | P1 |
| CT-LOC-06 | Coordenada como texto | Logado | POST com `latitude: "abc"` | 400 | API | P2 |

## 4. Cidadão — Acompanhar demandas

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-ACP-01 | Lista "Minhas Demandas" | Cidadão com demandas | Abrir aba de demandas | Só demandas próprias, mais recentes primeiro, com status | UI | P0 |
| CT-ACP-02 | Lista vazia | Cidadão novo | Abrir lista | Empty state + botão "Nova demanda" | UI | P1 |
| CT-ACP-03 | Erro ao carregar | API fora do ar | Abrir lista | `ErrorState` com mensagem; lista vazia | UI | P1 |
| CT-ACP-04 | Busca por protocolo | Demanda `URB-12345` existe | `GET /api/demands?busca=URB-12345` | Retorna a demanda | API | P1 |
| CT-ACP-05 | Busca por texto | — | `busca` com trecho do título ou descrição | Retorna correspondências; sem resultado → lista vazia | API/UI | P1 |
| CT-ACP-06 | Filtros | — | `status`, `categoria`, `prioridade`, `bairro` combinados | Resultado atende a todos os filtros (AND) | API | P1 |
| CT-ACP-07 | Filtro com valor inválido | — | `?status=xyz` | 400 | API | P2 |
| CT-ACP-08 | Detalhe da demanda | Demanda própria | Abrir detalhe | Status, prioridade, endereço, foto e histórico em ordem cronológica; sem ações de gestor | UI | P0 |
| CT-ACP-09 | Status atualizado pelo gestor | Gestor alterou status | Cidadão reabre/atualiza o detalhe | Novo status e nova entrada do histórico com observação do gestor | UI | P0 |

## 5. Gestor — Painel, fila e triagem

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-GES-01 | Métricas do painel | Demandas em vários status | Abrir `/gestor` | Cards Total, Em análise, Encaminhadas, Em atendimento, Resolvidas e Tempo médio batem com o banco | UI/API | P0 |
| CT-GES-02 | Erro nas métricas | Endpoint de métricas falha | Abrir painel | Mensagem de erro + "Tentar novamente"; retry recarrega | UI | P1 |
| CT-GES-03 | Métricas sem Redis | Redis indisponível | `GET /api/metrics/summary` | Mesmo resultado vindo do banco | API | P1 |
| CT-GES-04 | Demandas por categoria | — | Abrir painel | Categorias ordenadas da maior para a menor contagem | UI | P2 |
| CT-GES-05 | Fila de triagem — quem entra | Demandas `registrada`/`em_analise` com e sem foto/sugestão; outras em `encaminhada` | Abrir painel | Fila mostra só `registrada`/`em_analise` com `imagemUrl` **ou** `sugestaoEncaminhamento` | UI | P0 |
| CT-GES-06 | Card de triagem | Demanda com foto | Ver card | Foto carregada (URL relativa resolvida pela origem da API), protocolo, título, descrição (2 linhas), "Sugestão: <órgão> (NN% confiança)" | UI | P0 |
| CT-GES-07 | Fila vazia | Nenhuma demanda pendente | Abrir painel | "Nenhuma demanda pendente de triagem." | UI | P1 |
| CT-GES-08 | Aceitar triagem | Demanda na fila | Tocar `btn-aceitar-<protocolo>` | Status `encaminhada`; observação = sugestão; alerta "Triagem aceita"; sai da fila; métrica "Encaminhadas" +1 | UI/E2E | P0 |
| CT-GES-09 | Aceitar com erro | API falha | Aceitar | Alerta "Não foi possível aceitar a triagem."; demanda continua na fila | UI | P1 |
| CT-GES-10 | Revisar triagem | Demanda na fila | Tocar "Revisar" | Abre detalhe da demanda com ações do gestor | UI | P1 |
| CT-GES-11 | Filtro de status da fila recente | — | Selecionar status no filtro; depois "todos" | Lista recarregada só com o status; vazio remove o filtro | UI | P1 |
| CT-GES-12 | Imagem quebrada | `imagemUrl` aponta para arquivo removido | Abrir painel | Card renderiza sem quebrar o layout | UI | P2 |

## 6. Gestor — Alterar status

| ID | Cenário | Pré-condição | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- | --- |
| CT-STA-01 | Alterar com observação | Gestor no detalhe | Digitar observação, tocar `btn-status-em_atendimento` | 200; status atualizado; histórico com observação e autor = nome do gestor; alerta "Demanda atualizada" | UI/API | P0 |
| CT-STA-02 | Alterar sem observação | Gestor no detalhe | Tocar status sem observação | Histórico registra "Status atualizado para <status>" | UI | P1 |
| CT-STA-03 | Botão do status atual | Demanda `encaminhada` | Ver botões | Botão "Encaminhada" desabilitado | UI | P2 |
| CT-STA-04 | Fluxo completo | Demanda nova | `em_analise` → `encaminhada` → `em_atendimento` → `resolvida` | 4 entradas novas no histórico, em ordem; cidadão vê "Resolvida" | E2E | P0 |
| CT-STA-05 | Cancelar demanda | Demanda aberta | Status `cancelada` com observação | Status `cancelada`; motivo visível ao cidadão | UI | P1 |
| CT-STA-06 | Status inválido | Gestor | PATCH com `status: "xyz"` | 400 | API | P1 |
| CT-STA-07 | Demanda inexistente | Gestor | PATCH em id inexistente | 404 `DEMAND_NOT_FOUND` | API | P1 |
| CT-STA-08 | Transição regressiva | Demanda `resolvida` ou `cancelada` | PATCH para `em_analise` | **Definir regra.** Hoje qualquer transição é aceita (não há máquina de estados) — demanda encerrada pode ser reaberta sem controle | API | P1 |
| CT-STA-09 | Mesmo status via API | Demanda `encaminhada` | PATCH para `encaminhada` | **Esperado:** rejeitado ou sem nova entrada no histórico. Hoje duplica entrada no histórico | API | P2 |
| CT-STA-10 | Métricas após alteração | Cache preenchido | Alterar status; ler métricas | Contagens refletem a mudança imediatamente | API | P1 |
| CT-STA-11 | Concorrência | Dois gestores | Dois PATCH simultâneos (`Promise.all`) na mesma demanda | Status final consistente com o último write; exatamente 2 entradas novas no histórico, sem corrupção | API | P2 |

## 7. Não funcionais

| ID | Cenário | Passos | Resultado esperado | Tipo | Prio |
| --- | --- | --- | --- | --- | --- |
| CT-NF-01 | Health check | `GET /api/health` | 200 `{ status: "ok" }` | API | P1 |
| CT-NF-02 | Formato de erro | Provocar 400, 401, 403, 404, 500 | Corpo padrão com `code` e mensagem; sem stack trace em produção | API | P1 |
| CT-NF-03 | Cookie de sessão em produção | Login com `NODE_ENV=production` | Cookie `httpOnly`, `secure`, `sameSite=none` | API | P1 |
| CT-NF-04 | Tempo de resposta | Listar 1.000 demandas | Resposta < 2 s; considerar paginação (hoje `findMany` sem limite) | API | P2 |
| CT-NF-05 | Acessibilidade | Navegar com TalkBack/VoiceOver | Campos, botões e badges de status com rótulo lido corretamente | Manual | P2 |
| CT-NF-06 | Rede instável | Registrar demanda com 3G lento | Loading visível; sem envio duplicado; erro claro em timeout | Manual | P2 |

---

## Defeitos prováveis encontrados na análise

| Caso | Onde | Resumo |
| --- | --- | --- |
| CT-AUTH-10 | `authController.registerSchema`, `cadastro.tsx` | Qualquer pessoa pode se cadastrar como gestor — **crítico** |
| CT-VIS-12 | `visionService.triarImagem` | Falha do Vision derruba o upload em vez de cair no fallback |
| CT-DEM-12 | `demandService.create` | `scoreTriagem` fixo, ignora o score real da imagem |
| CT-FOTO-11 | `uploadMiddleware.fileFilter` | Tipo validado só pelo mimetype enviado pelo cliente |
| CT-STA-08/09 | `demandService.updateStatus` | Sem máquina de estados; reabre demanda encerrada e duplica histórico |

## Resumo

| Módulo | Casos |
| --- | --- |
| Autenticação | 16 |
| Controle de acesso | 10 |
| Foto e upload | 13 |
| Classificação | 13 |
| Formulário | 19 |
| Localização | 6 |
| Acompanhamento | 9 |
| Painel e triagem | 12 |
| Alteração de status | 11 |
| Não funcionais | 6 |
| **Total** | **115** |
