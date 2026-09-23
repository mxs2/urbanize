# Plano de Testes — Urbanize

**Escopo:** `backend/` (Express + Prisma) e `mobile/` (Expo/React Native)
**Planilha de origem:** [Google Sheets](https://docs.google.com/spreadsheets/d/1JBFtfe4tXyT1ysQPIRPgsehFX_fubWEBVphiHgesVKE/edit?gid=1407582128#gid=1407582128) · exports em [`docs/sheets/plano-de-testes/`](../sheets/plano-de-testes/)

Como os testes estão organizados e como rodar cada um: [organizacao-e-execucao.md](organizacao-e-execucao.md).

## Estratégia

Peso maior em **teste de API** (regras de negócio e autorização por perfil vivem ali, é o maior
risco do sistema); **componente** para hooks/estados de tela; **poucos E2E**, só as jornadas
críticas de cidadão e gestor.

## Camadas e ferramentas

| Camada | Ferramenta | Por quê |
| --- | --- | --- |
| Unitário/componente (mobile) | Jest (`jest-expo`) + RNTL | Caminho oficial do Expo, mesma linguagem do backend |
| API/aceitação (backend) | Jest + Supertest | Testa rota, status e autorização em memória, sem subir servidor |
| E2E | Playwright, contra `expo start --web` | Roda no Chromium sem emulador nem build nativo — viável no prazo e na apresentação |
| Concorrência | Jest + Supertest (`Promise.all`) | Cobre requisito de concorrência/idempotência sem infra extra |
| Análise estática | ESLint + TypeScript strict | Já configurado, roda antes da suíte |
| CI | GitHub Actions | Roda a cada push/PR, bloqueia merge com build vermelho |

Dependência externa (Google Vision) é mockada com `nock` — elimina custo por chamada e
não-determinismo do modelo dentro da suíte.

## Casos priorizados

| ID | Cenário | Camada | Prio | Status |
| --- | --- | --- | --- | --- |
| AUT-01 | Cidadão recebe 403 ao tentar alterar status de demanda | API | P0 | Automatizado |
| AUT-02 | Login retorna token válido e perfil correto (cidadão e gestor) | API | P0 | Automatizado |
| AUT-03 | Rota protegida sem token ou com token inválido retorna 401 | API | P0 | Automatizado |
| AUT-04 | Criar demanda com imagem retorna categoria, órgão, título e descrição | API | P0 | Automatizado |
| AUT-05 | Gestor altera status e a mudança aparece no histórico | API | P0 | Automatizado |
| AUT-06 | Vision indisponível cai no fallback de categoria manual | API | P1 | Automatizado |
| AUT-07 | Campos obrigatórios ausentes retornam erro claro | API | P1 | Automatizado |
| AUT-08 | Filtros de listagem retornam só o que o perfil pode ver | API | P1 | Automatizado |
| AUT-09 | Métricas com e sem Redis retornam o mesmo resultado | API | P1 | Automatizado |
| AUT-10 | `useRoleGuard` redireciona cidadão do painel de gestor | Componente | P1 | Não iniciado |
| AUT-11 | Tela de nova demanda exibe loading, empty e error state | Componente | P2 | Não iniciado |
| AUT-12 | E2E: login cidadão, criar demanda, ver na listagem | E2E | P1 | **Automatizado** |
| AUT-13 | E2E: login gestor, revisar triagem, alterar status | E2E | P1 | **Automatizado** |
| AUT-14 | Dois gestores alteram a mesma demanda em paralelo sem duplicar histórico | Concorrência | P2 | Não iniciado |
| AUT-15 | Cron executado duas vezes não duplica `MetricsSnapshot` | Concorrência | P2 | Não iniciado |
| AUT-16 | Pipeline de CI roda a suíte a cada push e bloqueia merge vermelho | CI | P1 | Não iniciado |

**Critério de seleção:** repete a cada regressão, alto impacto, determinístico, custo baixo.

## Fora de escopo (validação manual)

- Precisão da classificação de imagem do Google Vision — não-determinístico e pago.
- Captura por câmera em aparelho físico — depende de hardware; o mock cobre o fluxo lógico.
- Responsividade em múltiplos aparelhos — custo alto, valor baixo pro prazo da disciplina.
- Usabilidade e teste exploratório — depende de julgamento humano.

## Riscos críticos

| Risco | Mitigação |
| --- | --- |
| Cidadão conseguir alterar status de demanda | AUT-01 — 403 esperado |
| Token inválido ou ausente não barrado | AUT-03 — 401 esperado |
| Demanda criada sem imagem ou sem órgão responsável | AUT-04, AUT-07 |
| Google Vision indisponível ou fora de crédito | AUT-06 — fallback com nock |
| Histórico duplicado em edição concorrente | AUT-14 |
| Métricas divergentes entre cache e banco | AUT-09 |

Riscos críticos correspondem aos mapeados em [`docs/requisitos-seguranca.md`](../requisitos-seguranca.md).

## Resumo

| Indicador | Quantidade |
| --- | --- |
| Total de casos | 16 |
| Automatizado | 10 (62,5%) |
| Não iniciado | 6 (37,5%) |

**Critério de saída da fase 1:** todos os casos P0 automatizados e verdes no CI. Cobertura de
código é indicador de apoio, não meta — o alvo é cobrir os riscos mapeados.
