# Checklist de Implementação dos Casos de Teste — Urbanize

Acompanha a automação dos casos de [casos-de-teste.md](casos-de-teste.md). Os testes automatizados não citam os IDs
TCxx; o vínculo abaixo foi feito pelo que cada teste verifica.

**Legenda:** ✅ implementado · 🟡 parcial (o teste existe, mas não cobre tudo o que o caso pede; ver
[notas](#notas-dos-parciais)) · ⬜ pendente

**Nível:** o nível de teste definido no caso — Componente (unitário/componente do app), Integração (integração de
componentes, testada pela API) e Sistema (E2E pela interface).

**Teste:** onde o caso está automatizado.

| Prefixo | Arquivo |
| --- | --- |
| CT-AUTH | `tests/acceptance/01_auth.test.ts` |
| CT-DEM | `tests/acceptance/02_demands.test.ts` |
| CT-MET | `tests/acceptance/03_metrics_and_organs.test.ts` |
| CT-GEN | `tests/acceptance/04_general.test.ts` |
| BDD login | `tests/bdd/features/login.feature` |
| unit api / unit session | `tests/unit/services/api.test.ts` / `session.test.ts` |
| E2E `<nome>` | `e2e/tests/<nome>.spec.ts` |

**Pipeline:** em que etapas do [workflow de regressão](../../.github/workflows/regressao.yml) o teste roda — `push`
(qualquer branch: unitários e API), `PR` (antes do merge na main: unitários, API e E2E `@smoke`) e `diário` (suíte
completa às 23h). Ver [organizacao-e-execucao.md](organizacao-e-execucao.md#pipeline-no-github-actions--como-acionar).
`manual` marca os casos que a seleção para automação ([plano, seção 5](plano-de-testes-e-backlog.md#5-seleção-para-automação))
manteve em execução manual; eles ficam fora do backlog de automação.

**Responsável:** quem implementa o caso pendente ou completa o parcial do backlog de automação.

## Resumo

**Total:** 94 casos — ✅ 38 · 🟡 10 · ⬜ 46

| Nível | ✅ | 🟡 | ⬜ | Total |
| --- | --- | --- | --- | --- |
| Integração de componentes | 30 | 7 | 29 | 66 |
| Sistema | 6 | 3 | 15 | 24 |
| Componente | 2 | 0 | 2 | 4 |

Dos ⬜ e 🟡, 12 casos são manuais; os outros 44 formam o backlog de automação pendente, distribuído assim:

| Responsável | Casos | Tema |
| --- | --- | --- |
| Enzo Antuna | TC02, TC03, TC04, TC05, TC06, TC07, TC08, TC09, TC10 | Cadastro e validação de cadastro (API) |
| Hyngrid | TC29, TC30, TC31, TC32, TC34, TC36, TC57, TC58, TC60 | Criação de demanda, valores padrão e filtros (API) |
| Janderson | TC37, TC39, TC54, TC61, TC76, TC77, TC86, TC87 | Enums, listagem por órgão, ciclo de status e métricas sem Redis (API) |
| Pamela | TC12, TC17, TC24, TC25, TC26, TC62, TC92, TC93, TC94 | Login, sessão e logout (API); cadastro, filtro e responsividade (E2E) |
| Diego Xavier | TC44, TC46, TC47, TC48, TC49, TC50, TC65, TC82, TC83 | Componentes do app, upload e triagem/Vision |

## Checklist

| Status | ID | HU | Título | Nível | Teste | Pipeline | Responsável |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ | [TC01](casos-de-teste.md#tc01) | HU-01 | Cadastrar usuário com dados válidos. | Integração | CT-AUTH-01 | push · PR · diário | — |
| 🟡 | [TC02](casos-de-teste.md#tc02) | HU-01 | Verificar que o cadastro cria o cookie de sessão HTTP-only. | Integração | CT-AUTH-01 | push · PR · diário | Enzo Antuna |
| ⬜ | [TC03](casos-de-teste.md#tc03) | HU-01 | Atribuir o perfil cidadao quando role é omitido. | Integração | — | — | Enzo Antuna |
| ⬜ | [TC04](casos-de-teste.md#tc04) | HU-01 | Cadastrar usuário com perfil gestor. | Integração | — | — | Enzo Antuna |
| ⬜ | [TC05](casos-de-teste.md#tc05) | HU-01 | Recusar cadastro com role fora do enum. | Integração | — | — | Enzo Antuna |
| 🟡 | [TC06](casos-de-teste.md#tc06) | HU-01 | Recusar cadastro com nome de 1 caractere. | Integração | CT-AUTH-03 | push · PR · diário | Enzo Antuna |
| ⬜ | [TC07](casos-de-teste.md#tc07) | HU-01 | Aceitar cadastro com nome de 2 caracteres. | Integração | — | — | Enzo Antuna |
| 🟡 | [TC08](casos-de-teste.md#tc08) | HU-01 | Recusar cadastro com senha vazia. | Integração | CT-AUTH-03 | push · PR · diário | Enzo Antuna |
| ⬜ | [TC09](casos-de-teste.md#tc09) | HU-01 | Aceitar cadastro com senha de 1 caractere. | Integração | — | — | Enzo Antuna |
| 🟡 | [TC10](casos-de-teste.md#tc10) | HU-01 | Recusar cadastro com e-mail em formato inválido. | Integração | CT-AUTH-03 | push · PR · diário | Enzo Antuna |
| ✅ | [TC11](casos-de-teste.md#tc11) | HU-01 | Recusar cadastro com e-mail já cadastrado. | Integração | CT-AUTH-02 | push · PR · diário | — |
| ⬜ | [TC12](casos-de-teste.md#tc12) | HU-01 | Criar conta de cidadão pela tela de cadastro. | Sistema | — | — | Pamela |
| ✅ | [TC13](casos-de-teste.md#tc13) | HU-02 | Autenticar usuário com perfil cidadão. | Integração | CT-AUTH-04, BDD login | push · PR · diário | — |
| ✅ | [TC14](casos-de-teste.md#tc14) | HU-02 | Autenticar usuário com perfil gestor. | Integração | CT-AUTH-05 | push · PR · diário | — |
| ✅ | [TC15](casos-de-teste.md#tc15) | HU-02 | Recusar login com senha incorreta. | Integração | CT-AUTH-06 | push · PR · diário | — |
| ✅ | [TC16](casos-de-teste.md#tc16) | HU-02 | Recusar login com e-mail não cadastrado. | Integração | CT-AUTH-07 | push · PR · diário | — |
| ⬜ | [TC17](casos-de-teste.md#tc17) | HU-02 | Recusar login sem o campo email. | Integração | — | — | Pamela |
| ✅ | [TC18](casos-de-teste.md#tc18) | HU-02 | Entrar pela tela de login com perfil cidadão. | Sistema | E2E registrar-demanda | PR (smoke) · diário | — |
| ✅ | [TC19](casos-de-teste.md#tc19) | HU-02 | Entrar pela tela de login com perfil gestor. | Sistema | E2E gestor-gerencia-demanda | PR (smoke) · diário | — |
| ✅ | [TC20](casos-de-teste.md#tc20) | HU-02 | Guardar na sessão o token retornado pelo login. | Componente | unit session | push · PR · diário | — |
| ✅ | [TC21](casos-de-teste.md#tc21) | HU-02 | Enviar o token da sessão no cabeçalho Authorization das requisições. | Componente | unit api | push · PR · diário | — |
| ✅ | [TC22](casos-de-teste.md#tc22) | HU-02 | Recusar acesso a rota protegida sem credencial. | Integração | CT-AUTH-09 | push · PR · diário | — |
| ✅ | [TC23](casos-de-teste.md#tc23) | HU-02 | Recusar acesso com token adulterado. | Integração | CT-AUTH-10 | push · PR · diário | — |
| ⬜ | [TC24](casos-de-teste.md#tc24) | HU-02 | Recusar acesso com token expirado. | Integração | — | — | Pamela |
| ⬜ | [TC25](casos-de-teste.md#tc25) | HU-02 | Autenticar requisição usando só o cookie de sessão. | Integração | — | — | Pamela |
| 🟡 | [TC26](casos-de-teste.md#tc26) | HU-02 | Remover o cookie de sessão no logout. | Integração | CT-AUTH-11 | push · PR · diário | Pamela |
| ✅ | [TC27](casos-de-teste.md#tc27) | SUPOSIÇÃO | Retornar erro padronizado para rota inexistente. | Integração | CT-GEN-03 | push · PR · diário | — |
| ✅ | [TC28](casos-de-teste.md#tc28) | HU-03 | Gerar protocolo ao criar demanda válida. | Integração | CT-DEM-01 | push · PR · diário | — |
| 🟡 | [TC29](casos-de-teste.md#tc29) | HU-03 | Criar a demanda com status inicial registrada. | Integração | CT-DEM-01 | push · PR · diário | Hyngrid |
| ⬜ | [TC30](casos-de-teste.md#tc30) | HU-03 | Aplicar prioridade padrão media quando prioridade é omitida. | Integração | — | — | Hyngrid |
| ⬜ | [TC31](casos-de-teste.md#tc31) | HU-03 | Aplicar bairro e cidade padrão quando omitidos. | Integração | — | — | Hyngrid |
| ⬜ | [TC32](casos-de-teste.md#tc32) | HU-03 | Preencher o solicitante com os dados do usuário autenticado. | Integração | — | — | Hyngrid |
| ✅ | [TC33](casos-de-teste.md#tc33) | HU-03 | Recusar demanda com titulo de 2 caracteres. | Integração | CT-DEM-03 | push · PR · diário | — |
| ⬜ | [TC34](casos-de-teste.md#tc34) | HU-03 | Aceitar demanda com todos os obrigatórios no tamanho mínimo. | Integração | — | — | Hyngrid |
| ✅ | [TC35](casos-de-teste.md#tc35) | HU-03 | Recusar demanda com descricao de 4 caracteres. | Integração | CT-DEM-04 | push · PR · diário | — |
| ⬜ | [TC36](casos-de-teste.md#tc36) | HU-03 | Recusar demanda com endereco.endereco de 2 caracteres. | Integração | — | — | Hyngrid |
| ⬜ | [TC37](casos-de-teste.md#tc37) | HU-03 | Recusar demanda sem categoria. | Integração | — | — | Janderson |
| ✅ | [TC38](casos-de-teste.md#tc38) | HU-03 | Recusar demanda com categoria fora do enum. | Integração | CT-DEM-05 | push · PR · diário | — |
| ⬜ | [TC39](casos-de-teste.md#tc39) | HU-03 | Recusar demanda com prioridade fora do enum. | Integração | — | — | Janderson |
| ✅ | [TC40](casos-de-teste.md#tc40) | HU-03 | Recusar criação de demanda sem autenticação. | Integração | CT-DEM-02 | push · PR · diário | — |
| ✅ | [TC41](casos-de-teste.md#tc41) | HU-03 | Abrir a tela de detalhe com o protocolo depois de registrar a demanda. | Sistema | E2E registrar-demanda | PR (smoke) · diário | — |
| ⬜ | [TC42](casos-de-teste.md#tc42) | HU-03 | Impedir o envio da demanda sem localização. | Sistema | — | manual | — |
| ⬜ | [TC43](casos-de-teste.md#tc43) | HU-03 | Impedir o envio da demanda sem aceite de compartilhamento de dados. | Sistema | — | manual | — |
| ⬜ | [TC44](casos-de-teste.md#tc44) | HU-03 | Preencher título e descrição com a sugestão da triagem depois do upload. | Componente | — | — | Diego Xavier |
| ⬜ | [TC45](casos-de-teste.md#tc45) | HU-12 | Vincular à demanda criada a foto anexada no formulário. | Sistema | — | manual | — |
| ⬜ | [TC46](casos-de-teste.md#tc46) | HU-12 | Receber a URL da imagem ao enviar arquivo válido. | Integração | — | — | Diego Xavier |
| ⬜ | [TC47](casos-de-teste.md#tc47) | HU-12 | Recusar upload sem arquivo. | Integração | — | — | Diego Xavier |
| ⬜ | [TC48](casos-de-teste.md#tc48) | HU-12 | Recusar upload sem autenticação. | Integração | — | — | Diego Xavier |
| ⬜ | [TC49](casos-de-teste.md#tc49) | HU-08 | Usar a categoria enviada pelo frontend quando o Google Vision não está configurado. | Integração | — | — | Diego Xavier |
| ⬜ | [TC50](casos-de-teste.md#tc50) | HU-08 | Usar a categoria enviada quando o Google Vision configurado falha. | Integração | — | — | Diego Xavier |
| ⬜ | [TC51](casos-de-teste.md#tc51) | HU-03 | Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível. | Sistema | — | manual | — |
| ✅ | [TC52](casos-de-teste.md#tc52) | HU-06 | Listar para o cidadão só as próprias demandas. | Integração | CT-DEM-07 | push · PR · diário | — |
| ✅ | [TC53](casos-de-teste.md#tc53) | HU-06 | Listar a fila geral para gestor sem vínculo com órgão. | Integração | CT-DEM-08 | push · PR · diário | — |
| ⬜ | [TC54](casos-de-teste.md#tc54) | HU-06 | Listar para gestor vinculado só as demandas do seu órgão. | Integração | — | — | Janderson |
| ✅ | [TC55](casos-de-teste.md#tc55) | HU-06 | Filtrar demandas por status. | Integração | CT-DEM-09 | push · PR · diário | — |
| ✅ | [TC56](casos-de-teste.md#tc56) | HU-06 | Filtrar demandas por categoria. | Integração | CT-DEM-10 | push · PR · diário | — |
| ⬜ | [TC57](casos-de-teste.md#tc57) | HU-06 | Filtrar demandas por prioridade. | Integração | — | — | Hyngrid |
| ⬜ | [TC58](casos-de-teste.md#tc58) | HU-06 | Filtrar demandas por bairro. | Integração | — | — | Hyngrid |
| ✅ | [TC59](casos-de-teste.md#tc59) | HU-06 | Filtrar demandas por texto em busca. | Integração | CT-DEM-11 | push · PR · diário | — |
| ⬜ | [TC60](casos-de-teste.md#tc60) | HU-06 | Combinar filtros status e categoria. | Integração | — | — | Hyngrid |
| ⬜ | [TC61](casos-de-teste.md#tc61) | HU-06 | Recusar filtro com status fora do enum. | Integração | — | — | Janderson |
| ⬜ | [TC62](casos-de-teste.md#tc62) | HU-06 | Aplicar filtro de status na tela de listagem. | Sistema | — | — | Pamela |
| ⬜ | [TC63](casos-de-teste.md#tc63) | HU-06 | Exibir estado vazio na listagem de cidadão sem demandas. | Sistema | — | manual | — |
| ⬜ | [TC64](casos-de-teste.md#tc64) | HU-06 | Exibir estado de erro na listagem quando a API está indisponível. | Sistema | — | manual | — |
| ⬜ | [TC65](casos-de-teste.md#tc65) | HU-06 | Expor estado de carregamento enquanto a listagem está pendente. | Componente | — | — | Diego Xavier |
| ✅ | [TC66](casos-de-teste.md#tc66) | HU-04 | Consultar detalhe de demanda própria. | Integração | CT-DEM-13 | push · PR · diário | — |
| ✅ | [TC67](casos-de-teste.md#tc67) | HU-04 | Recusar ao cidadão o detalhe de demanda de outra pessoa. | Integração | CT-DEM-14 | push · PR · diário | — |
| ✅ | [TC68](casos-de-teste.md#tc68) | HU-04 | Retornar erro para demanda inexistente. | Integração | CT-DEM-16 | push · PR · diário | — |
| 🟡 | [TC69](casos-de-teste.md#tc69) | HU-04 | Exibir no detalhe os seis dados exigidos da demanda. | Sistema | E2E registrar-demanda | PR (smoke) · diário | — |
| ✅ | [TC70](casos-de-teste.md#tc70) | HU-05 | Atualizar o status da demanda como gestor. | Integração | CT-DEM-18 | push · PR · diário | — |
| ✅ | [TC71](casos-de-teste.md#tc71) | HU-05 | Acrescentar item ao histórico ao atualizar o status. | Integração | CT-DEM-18 | push · PR · diário | — |
| ✅ | [TC72](casos-de-teste.md#tc72) | HU-05 | Recusar atualização de status feita por cidadão. | Integração | CT-DEM-17 | push · PR · diário | — |
| ✅ | [TC73](casos-de-teste.md#tc73) | HU-05 | Recusar atualização de status sem autenticação. | Integração | CT-DEM-21 | push · PR · diário | — |
| ✅ | [TC74](casos-de-teste.md#tc74) | HU-05 | Recusar atualização com status fora do enum. | Integração | CT-DEM-19 | push · PR · diário | — |
| ✅ | [TC75](casos-de-teste.md#tc75) | HU-05 | Recusar atualização de status de demanda inexistente. | Integração | CT-DEM-20 | push · PR · diário | — |
| 🟡 | [TC76](casos-de-teste.md#tc76) | HU-05 | Percorrer o ciclo nominal de status até resolvida. | Integração | E2E gestor-gerencia-demanda | push · PR · diário | Janderson |
| ⬜ | [TC77](casos-de-teste.md#tc77) | HU-05 | Cancelar demanda com status registrada. | Integração | — | — | Janderson |
| ✅ | [TC78](casos-de-teste.md#tc78) | HU-04 | Exibir ao cidadão o status alterado pelo gestor. | Sistema | E2E gestor-gerencia-demanda | PR (smoke) · diário | — |
| ✅ | [TC79](casos-de-teste.md#tc79) | HU-05 | Exibir no histórico a observação registrada pelo gestor. | Sistema | E2E gestor-gerencia-demanda | PR (smoke) · diário | — |
| 🟡 | [TC80](casos-de-teste.md#tc80) | HU-07 | Exibir no painel do gestor o total de demandas das métricas gerais. | Sistema | E2E gestor-aceita-triagem | diário | — |
| ✅ | [TC81](casos-de-teste.md#tc81) | HU-07 | Exibir na fila recente a demanda criada por último. | Sistema | E2E gestor-aceita-triagem | diário | — |
| 🟡 | [TC82](casos-de-teste.md#tc82) | HU-08 | Exibir categoria, confiança e sugestão de encaminhamento na triagem. | Sistema | E2E gestor-aceita-triagem | diário | Diego Xavier |
| ⬜ | [TC83](casos-de-teste.md#tc83) | HU-08 | Sugerir o órgão cujo categoriasJson contém a categoria da demanda. | Integração | — | — | Diego Xavier |
| ✅ | [TC84](casos-de-teste.md#tc84) | HU-10 | Retornar ao cidadão métricas só das próprias demandas. | Integração | CT-MET-02 | push · PR · diário | — |
| ✅ | [TC85](casos-de-teste.md#tc85) | HU-07 | Retornar ao gestor métricas gerais. | Integração | CT-MET-01 | push · PR · diário | — |
| ⬜ | [TC86](casos-de-teste.md#tc86) | HU-07 | Responder métricas sem Redis configurado. | Integração | — | — | Janderson |
| ⬜ | [TC87](casos-de-teste.md#tc87) | HU-07 | Responder métricas com Redis configurado mas inacessível. | Integração | — | — | Janderson |
| ⬜ | [TC88](casos-de-teste.md#tc88) | HU-10 | Exibir no dashboard do cidadão o total das próprias solicitações. | Sistema | — | manual | — |
| ⬜ | [TC89](casos-de-teste.md#tc89) | HU-02 | Navegar da home para a tela de login. | Sistema | — | manual | — |
| ⬜ | [TC90](casos-de-teste.md#tc90) | HU-01 | Navegar da home para a tela de cadastro. | Sistema | — | manual | — |
| ⬜ | [TC91](casos-de-teste.md#tc91) | HU-06 | Navegar da home para a tela de demandas. | Sistema | — | manual | — |
| ⬜ | [TC92](casos-de-teste.md#tc92) | HU-03 | Registrar demanda em viewport mobile sem rolagem horizontal. | Sistema | — | — | Pamela |
| ⬜ | [TC93](casos-de-teste.md#tc93) | HU-03 | Registrar demanda em viewport tablet sem rolagem horizontal. | Sistema | — | — | Pamela |
| ⬜ | [TC94](casos-de-teste.md#tc94) | HU-03 | Registrar demanda em viewport desktop sem rolagem horizontal. | Sistema | — | — | Pamela |

## Notas dos parciais

- **TC02:** Confere o cookie `urbanize_session`, mas não a flag `HttpOnly`.
- **TC06:** Nome, e-mail e senha inválidos na mesma requisição; não isola o campo.
- **TC08:** Idem TC06.
- **TC10:** Idem TC06.
- **TC26:** Não confere a remoção do cookie no `Set-Cookie`.
- **TC29:** Divergência: o teste espera status `em_analise` (`registrada` só no histórico); o caso espera `registrada`.
- **TC69:** Confere protocolo, título e status; faltam os demais dados exigidos.
- **TC76:** Ciclo coberto só pela UI; falta o teste de API.
- **TC80:** Lê as métricas "Em análise" e "Encaminhadas", não o total.
- **TC82:** Confere sugestão e confiança; não confere a categoria.

## Como atualizar

Ao automatizar um caso, troque o status, preencha a coluna "Teste" com o ID do teste (CT-xxx) ou o spec E2E, e
ajuste o resumo.
