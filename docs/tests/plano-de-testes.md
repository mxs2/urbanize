# Plano de Testes e Backlog de Automação — Urbanize

**Disciplina:** Testes Automatizados (TEST) — Entrega Unidade 1
**Escopo analisado:** `backend/` (Express + Prisma) e `mobile/` (Expo/React Native)
**Planilha de origem:** [Google Sheets](https://docs.google.com/spreadsheets/d/1JBFtfe4tXyT1ysQPIRPgsehFX_fubWEBVphiHgesVKE/edit?gid=1407582128#gid=1407582128)
**Exports CSV das abas:** [`docs/sheets/plano-de-testes/`](sheets/plano-de-testes/)
**Data do documento:** 19/08/2026

> A planilha é a fonte de edição colaborativa; este documento é a cópia versionada no repositório. Ao atualizar a planilha, reexportar as abas para `docs/sheets/plano-de-testes/` e refletir as mudanças aqui.

## 1. Estratégia de teste

Concentrar esforço em **teste de API no backend**, onde estão as regras de negócio e o maior risco (autorização por perfil e integridade da demanda); **teste de componente no app** para hooks e estados de tela; **poucos E2E** cobrindo apenas as jornadas críticas de cidadão e gestor.

## 2. Objetivos da automação

Cada objetivo tem meta verificável — serve de critério de aceite do plano.

| # | Objetivo | Meta mensurável | Como medir |
| --- | --- | --- | --- |
| 1 | Garantir que as regras de autorização por perfil nunca regridam | 100% dos cenários de permissão (cidadão × gestor) automatizados em API | Contagem de casos P0 verdes no relatório do Jest |
| 2 | Reduzir o tempo de regressão manual | Os 12 cenários TS01–TS12 executados em menos de 5 minutos | Tempo total da suíte no log do GitHub Actions |
| 3 | Detectar quebra de contrato da API antes do app | Toda rota REST com ao menos 1 teste de status code e formato de resposta | Rotas cobertas / rotas existentes em `backend/src/routes` |
| 4 | Tornar a triagem testável apesar da IA | Nenhum teste da suíte chama o Google Vision real; sucesso e fallback cobertos | Ausência de chamada externa (nock ativo) + 2 casos verdes |
| 5 | Rodar a suíte sem intervenção humana | Execução automática a cada push/PR, com build vermelho bloqueando merge | Workflow configurado e histórico de execuções no CI |
| 6 | Sustentar os requisitos de concorrência e distribuição | Acesso concorrente e idempotência do cron cobertos por teste automatizado | Casos AUT-14 e AUT-15 verdes |
| 7 | Manter a suíte confiável | Zero teste flaky tolerado — teste instável é corrigido ou removido | Reexecução da suíte 3× seguidas sem variação de resultado |

## 3. Seleção de casos de uso para automação

**Critério:** repete a cada regressão, alto impacto, determinístico, custo baixo, requisito estável.

| UC | Caso de uso | Automatizar? | Camada | Prio | Justificativa | Casos AUT |
| --- | --- | --- | --- | --- | --- | --- |
| UC01 | Autenticar usuário (cidadão e gestor) | Sim | API | P0 | Porta de entrada de todo o resto; determinístico e barato | AUT-02 |
| UC02 | Proteger rota por perfil e por token | Sim | API + Componente | P0 | Maior risco do sistema; regra impossível de validar bem na mão | AUT-01, AUT-03, AUT-10 |
| UC03 | Criar demanda com foto e triagem automática | Sim | API | P0 | Fluxo central; com Vision mockado o caso fica determinístico | AUT-04, AUT-06 |
| UC04 | Alterar status e registrar histórico | Sim | API | P0 | Regra exclusiva do gestor, com efeito colateral no histórico | AUT-05 |
| UC05 | Cadastrar usuário | Sim | API | P1 | Repetitivo e estável, porém de menor impacto que UC01/UC02 | AUT-07 |
| UC06 | Listar e filtrar demandas por perfil | Sim | API | P1 | Cidadão só vê as próprias — autorização disfarçada de filtro | AUT-08 |
| UC07 | Consultar métricas (com e sem Redis) | Sim | API | P1 | Cobre o requisito de cache e arquitetura distribuída | AUT-09 |
| UC08 | Ver detalhe e timeline da demanda | Sim | API | P1 | Contrato simples e alto valor de regressão | AUT-05 |
| UC09 | Jornada do cidadão (login, criar, listar) | Sim | E2E | P1 | Única forma de provar app e API integrados de ponta a ponta | AUT-12 |
| UC10 | Jornada do gestor (login, triar, mudar status) | Sim | E2E | P1 | Mesmo motivo, do outro lado do sistema | AUT-13 |
| UC11 | Estados de tela (loading, empty, error) | Sim | Componente | P2 | Barato com Testing Library e evita regressão de UX | AUT-11 |
| UC12 | Acesso concorrente à mesma demanda | Sim | API | P2 | Requisito da disciplina de computação concorrente | AUT-14 |
| UC13 | Idempotência do cron de métricas | Sim | API | P2 | Falha silenciosa e difícil de detectar manualmente | AUT-15 |
| UC14 | Precisão da classificação de imagem | Não | Manual | — | Não-determinístico e com custo por chamada — amostragem manual | — |
| UC15 | Captura por câmera em aparelho físico | Não | Manual | — | Depende de hardware; o mock cobre o fluxo lógico | — |
| UC16 | Responsividade em múltiplos aparelhos | Não | Manual | — | Custo alto e valor baixo para o prazo da disciplina | — |
| UC17 | Usabilidade e teste exploratório | Não | Manual | — | Depende de julgamento humano, não roteirizável | — |

## 4. Backlog de automação

Esforço em horas é estimativa da equipe, não medição. "Origem" cita os casos manuais TS01–TS12 do plano de testes da entrega anterior.

| ID | UC | Origem | Cenário a automatizar | Camada | Ferramenta | Prio | Esforço | Responsável | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUT-01 | UC02 | TS02 | Cidadão recebe 403 ao tentar alterar status de demanda | API | Jest + Supertest | P0 | 1h | | Não iniciado |
| AUT-02 | UC01 | TS01, TS02 | Login retorna token válido e perfil correto (cidadão e gestor) | API | Jest + Supertest | P0 | 2h | | Não iniciado |
| AUT-03 | UC02 | — | Rota protegida sem token ou com token inválido retorna 401 | API | Jest + Supertest | P0 | 1h | | Não iniciado |
| AUT-04 | UC03 | TS04 | Criar demanda com imagem retorna categoria, órgão, título e descrição | API | Jest + Supertest + nock | P0 | 3h | | Não iniciado |
| AUT-05 | UC04 | TS07, TS11 | Gestor altera status e a mudança aparece no histórico da demanda | API | Jest + Supertest | P0 | 2h | | Não iniciado |
| AUT-06 | UC03 | TS10 | Vision indisponível cai no fallback da categoria manual | API | Jest + Supertest + nock | P1 | 2h | | Não iniciado |
| AUT-07 | UC05 | TS03, TS05 | Campos obrigatórios ausentes retornam 400 com mensagem clara | API | Jest + Supertest | P1 | 2h | | Não iniciado |
| AUT-08 | UC06 | TS06 | Filtros de listagem retornam apenas demandas visíveis ao perfil | API | Jest + Supertest | P1 | 2h | | Não iniciado |
| AUT-09 | UC07 | TS08, TS09 | Métricas com e sem Redis retornam o mesmo resultado | API | Jest + Supertest | P1 | 3h | | Não iniciado |
| AUT-10 | UC02 | — | `useRoleGuard` redireciona cidadão que abre o painel do gestor | Componente | Jest (jest-expo) + RNTL | P1 | 2h | | Não iniciado |
| AUT-11 | UC11 | TS04 | Tela de nova demanda exibe loading, empty e error state | Componente | Jest (jest-expo) + RNTL | P2 | 3h | | Não iniciado |
| AUT-12 | UC09 | TS01, TS04, TS06 | E2E: login cidadão, criar demanda com foto, ver na listagem | E2E | Maestro | P1 | 4h | | Não iniciado |
| AUT-13 | UC10 | TS02, TS11 | E2E: login gestor, revisar triagem, alterar status | E2E | Maestro | P1 | 4h | | Não iniciado |
| AUT-14 | UC12 | — | Dois gestores alteram a mesma demanda em paralelo sem duplicar histórico | Concorrência | Jest + Supertest (`Promise.all`) | P2 | 3h | | Não iniciado |
| AUT-15 | UC13 | — | Cron executado duas vezes não duplica `MetricsSnapshot` | Concorrência | Jest + Supertest | P2 | 2h | | Não iniciado |
| AUT-16 | — | TS12 | Pipeline de CI executa a suíte a cada push e bloqueia merge vermelho | CI | GitHub Actions | P1 | 3h | | Não iniciado |

## 5. Escopo do plano

| Item | Dentro do escopo? | Observação |
| --- | --- | --- |
| Autenticação, perfis e proteção de rotas | Sim | Núcleo da regra de negócio — maior risco do sistema |
| CRUD de demandas (criar, listar, filtrar, detalhar) | Sim | Fluxo principal do cidadão |
| Upload de imagem e triagem automática | Sim | Vision mockado; testa-se o contrato e o fallback |
| Alteração de status e histórico | Sim | Ação exclusiva do gestor, com efeito colateral no histórico |
| Métricas com e sem Redis | Sim | Cobre o requisito de cache/arquitetura distribuída |
| Cron de snapshot de métricas | Sim | Verificar idempotência |
| Precisão da classificação do Google Vision | Não | Não-determinístico e pago — validação manual por amostragem |
| Câmera real do dispositivo | Não | Depende de hardware; mock de `expo-image-picker` cobre o fluxo |
| Aparência em múltiplos aparelhos e tamanhos | Não | Custo alto para o prazo — inspeção manual |
| Desempenho do Render em cold start | Não | Característica da hospedagem, não da aplicação |
| Testes exploratórios de usabilidade | Não | Por natureza não roteirizáveis |

## 6. Matriz de riscos

| Risco | Impacto | Mitigação pelo teste |
| --- | --- | --- |
| Cidadão conseguir alterar status de demanda | Crítico | AUT-01 — teste de API esperando 403 |
| Token inválido ou ausente não barrado | Crítico | AUT-03 — teste de API esperando 401 |
| Demanda criada sem imagem ou sem órgão responsável | Alto | AUT-04 e AUT-07 |
| Google Vision indisponível ou fora de crédito | Médio | AUT-06 — fallback com nock |
| Histórico duplicado em edição concorrente | Médio | AUT-14 — requisições em paralelo |
| Métricas divergentes entre cache e banco | Médio | AUT-09 — execução com e sem Redis |

Os riscos críticos desta matriz correspondem aos riscos mapeados em [`docs/requisitos-seguranca.md`](requisitos-seguranca.md) — a suíte de testes é a evidência de que os controles de segurança da squad SEG continuam valendo.

## 7. Decisão de ferramentas por camada

| Camada | Ferramenta escolhida | Alternativa avaliada | Por que a escolhida | Por que a alternativa foi descartada |
| --- | --- | --- | --- | --- |
| Unitário e API (backend) | Jest + Supertest | Vitest + Supertest | Padrão do ecossistema Node/Express; testa rota, status e autorização em memória; mesma sintaxe do mobile | Vitest é mais rápido, mas manter dois runners aumenta o custo de manutenção |
| Banco nos testes | SQLite de teste isolado (`.env.test`) | Testcontainers | Zero infraestrutura adicional e reset rápido entre suítes | Testcontainers é mais fiel à produção, mas só compensa quando migrarmos para Postgres |
| Dependência externa (IA) | nock | Chamada real ao Google Vision | Elimina custo por chamada e o não-determinismo do modelo dentro da suíte | Chamada real tornaria o teste lento, instável e dependente de crédito |
| Componente (mobile) | Jest com preset `jest-expo` + React Native Testing Library | Vitest + RTL web | Caminho oficial do Expo; resolve transform de módulos nativos e assets | RTL web testaria Expo Web, que não é o produto entregue |
| E2E mobile | Maestro | Detox | Arquivos YAML, curva baixa e roda em Expo Go sem build nativo | Detox é mais poderoso, mas exige dev client / build nativo e setup caro |
| Carga e concorrência | k6 | Artillery | Sintaxe JS familiar e boas métricas para medir o ganho do cache Redis | Artillery resolveria o mesmo, mas a equipe já conhece k6 |
| Análise estática | ESLint (`eslint-config-expo`) + TypeScript strict | SonarCloud | Já configurado no projeto e roda antes da suíte | SonarCloud agrega métricas, mas exige configuração extra fora do escopo |
| Execução automatizada | GitHub Actions | Execução local manual | Roda a cada push/PR e bloqueia merge com build vermelho | Execução manual não garante regressão contínua — suíte vira enfeite |

**Frase de defesa no debate:** escolhemos Jest + Supertest + Testing Library porque unifica a linguagem de teste entre backend e mobile — a equipe escreve tudo em TypeScript com uma sintaxe só — e Maestro para E2E porque é o único que roda no Expo Go sem exigir build nativo, o que era inviável no nosso prazo.

## 8. Resumo do backlog

| Indicador | Quantidade | % do backlog |
| --- | --- | --- |
| Total de casos no backlog | 16 | 100% |
| Prioridade P0 | 5 | 31,3% |
| Prioridade P1 | 8 | 50,0% |
| Prioridade P2 | 3 | 18,8% |
| Camada API | 9 | 56,3% |
| Camada Componente | 2 | 12,5% |
| Camada E2E | 2 | 12,5% |
| Camada Concorrência | 2 | 12,5% |
| Camada CI | 1 | 6,3% |
| Status: Automatizado | 0 | 0% |
| Status: Em andamento | 0 | 0% |
| Status: Não iniciado | 16 | 100% |
| **Esforço total estimado** | **39h** | |

**Critério de saída da fase 1:** todos os casos P0 automatizados e verdes no CI antes da próxima entrega. Cobertura de código é indicador de apoio, não meta — o alvo é cobrir os riscos mapeados.
