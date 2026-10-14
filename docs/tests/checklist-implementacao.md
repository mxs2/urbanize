# Checklist de Implementação dos Casos de Teste — Urbanize

Acompanha a automação dos casos de [casos-de-teste.md](casos-de-teste.md). Os testes automatizados não citam os IDs
TCxx; o vínculo abaixo foi feito pelo que cada teste verifica.

**Legenda:** ✅ implementado · 🟡 parcial (o teste existe, mas não cobre tudo o que o caso pede) · ⬜ pendente

**Nível:** o nível de teste definido no caso — Componente (unitário/componente do app), Integração de componentes (API)
e Sistema (E2E pela interface).

## Resumo

**Total:** 94 casos — ✅ 38 · 🟡 10 · ⬜ 46

| Nível | ✅ | 🟡 | ⬜ | Total |
| --- | --- | --- | --- | --- |
| Integração de componentes | 30 | 7 | 29 | 66 |
| Sistema | 6 | 3 | 15 | 24 |
| Componente | 2 | 0 | 2 | 4 |

## Checklist

| Status | ID | HU | Título | Nível | Teste automatizado | Observação |
| --- | --- | --- | --- | --- | --- | --- |
| ✅ | [TC01](casos-de-teste.md#tc01) | HU-01 | Cadastrar usuário com dados válidos. | Integração de componentes | CT-AUTH-01 (`tests/acceptance/01_auth.test.ts`) |  |
| 🟡 | [TC02](casos-de-teste.md#tc02) | HU-01 | Verificar que o cadastro cria o cookie de sessão HTTP-only. | Integração de componentes | CT-AUTH-01 (`tests/acceptance/01_auth.test.ts`) | Confere o cookie `urbanize_session`, mas não a flag `HttpOnly`. |
| ⬜ | [TC03](casos-de-teste.md#tc03) | HU-01 | Atribuir o perfil cidadao quando role é omitido. | Integração de componentes | — |  |
| ⬜ | [TC04](casos-de-teste.md#tc04) | HU-01 | Cadastrar usuário com perfil gestor. | Integração de componentes | — |  |
| ⬜ | [TC05](casos-de-teste.md#tc05) | HU-01 | Recusar cadastro com role fora do enum. | Integração de componentes | — |  |
| 🟡 | [TC06](casos-de-teste.md#tc06) | HU-01 | Recusar cadastro com nome de 1 caractere. | Integração de componentes | CT-AUTH-03 (`tests/acceptance/01_auth.test.ts`) | Nome, e-mail e senha inválidos na mesma requisição; não isola o campo. |
| ⬜ | [TC07](casos-de-teste.md#tc07) | HU-01 | Aceitar cadastro com nome de 2 caracteres. | Integração de componentes | — |  |
| 🟡 | [TC08](casos-de-teste.md#tc08) | HU-01 | Recusar cadastro com senha vazia. | Integração de componentes | CT-AUTH-03 (`tests/acceptance/01_auth.test.ts`) | Idem TC06. |
| ⬜ | [TC09](casos-de-teste.md#tc09) | HU-01 | Aceitar cadastro com senha de 1 caractere. | Integração de componentes | — |  |
| 🟡 | [TC10](casos-de-teste.md#tc10) | HU-01 | Recusar cadastro com e-mail em formato inválido. | Integração de componentes | CT-AUTH-03 (`tests/acceptance/01_auth.test.ts`) | Idem TC06. |
| ✅ | [TC11](casos-de-teste.md#tc11) | HU-01 | Recusar cadastro com e-mail já cadastrado. | Integração de componentes | CT-AUTH-02 (`tests/acceptance/01_auth.test.ts`) |  |
| ⬜ | [TC12](casos-de-teste.md#tc12) | HU-01 | Criar conta de cidadão pela tela de cadastro. | Sistema | — |  |
| ✅ | [TC13](casos-de-teste.md#tc13) | HU-02 | Autenticar usuário com perfil cidadão. | Integração de componentes | CT-AUTH-04 (`tests/acceptance/01_auth.test.ts`); `tests/bdd/features/login.feature` |  |
| ✅ | [TC14](casos-de-teste.md#tc14) | HU-02 | Autenticar usuário com perfil gestor. | Integração de componentes | CT-AUTH-05 (`tests/acceptance/01_auth.test.ts`) |  |
| ✅ | [TC15](casos-de-teste.md#tc15) | HU-02 | Recusar login com senha incorreta. | Integração de componentes | CT-AUTH-06 (`tests/acceptance/01_auth.test.ts`) |  |
| ✅ | [TC16](casos-de-teste.md#tc16) | HU-02 | Recusar login com e-mail não cadastrado. | Integração de componentes | CT-AUTH-07 (`tests/acceptance/01_auth.test.ts`) |  |
| ⬜ | [TC17](casos-de-teste.md#tc17) | HU-02 | Recusar login sem o campo email. | Integração de componentes | — |  |
| ✅ | [TC18](casos-de-teste.md#tc18) | HU-02 | Entrar pela tela de login com perfil cidadão. | Sistema | `e2e/tests/registrar-demanda.spec.ts` (passo de login) |  |
| ✅ | [TC19](casos-de-teste.md#tc19) | HU-02 | Entrar pela tela de login com perfil gestor. | Sistema | `e2e/tests/gestor-gerencia-demanda.spec.ts` (passo de login) |  |
| ✅ | [TC20](casos-de-teste.md#tc20) | HU-02 | Guardar na sessão o token retornado pelo login. | Componente | `tests/unit/services/session.test.ts` |  |
| ✅ | [TC21](casos-de-teste.md#tc21) | HU-02 | Enviar o token da sessão no cabeçalho Authorization das requisições. | Componente | `tests/unit/services/api.test.ts` |  |
| ✅ | [TC22](casos-de-teste.md#tc22) | HU-02 | Recusar acesso a rota protegida sem credencial. | Integração de componentes | CT-AUTH-09 (`tests/acceptance/01_auth.test.ts`) |  |
| ✅ | [TC23](casos-de-teste.md#tc23) | HU-02 | Recusar acesso com token adulterado. | Integração de componentes | CT-AUTH-10 (`tests/acceptance/01_auth.test.ts`) |  |
| ⬜ | [TC24](casos-de-teste.md#tc24) | HU-02 | Recusar acesso com token expirado. | Integração de componentes | — |  |
| ⬜ | [TC25](casos-de-teste.md#tc25) | HU-02 | Autenticar requisição usando só o cookie de sessão. | Integração de componentes | — |  |
| 🟡 | [TC26](casos-de-teste.md#tc26) | HU-02 | Remover o cookie de sessão no logout. | Integração de componentes | CT-AUTH-11 (`tests/acceptance/01_auth.test.ts`) | Não confere a remoção do cookie no `Set-Cookie`. |
| ✅ | [TC27](casos-de-teste.md#tc27) | SUPOSIÇÃO | Retornar erro padronizado para rota inexistente. | Integração de componentes | CT-GEN-03 (`tests/acceptance/04_general.test.ts`) |  |
| ✅ | [TC28](casos-de-teste.md#tc28) | HU-03 | Gerar protocolo ao criar demanda válida. | Integração de componentes | CT-DEM-01 (`tests/acceptance/02_demands.test.ts`) |  |
| 🟡 | [TC29](casos-de-teste.md#tc29) | HU-03 | Criar a demanda com status inicial registrada. | Integração de componentes | CT-DEM-01 (`tests/acceptance/02_demands.test.ts`) | Divergência: o teste espera status `em_analise` (`registrada` só no histórico); o caso espera `registrada`. |
| ⬜ | [TC30](casos-de-teste.md#tc30) | HU-03 | Aplicar prioridade padrão media quando prioridade é omitida. | Integração de componentes | — |  |
| ⬜ | [TC31](casos-de-teste.md#tc31) | HU-03 | Aplicar bairro e cidade padrão quando omitidos. | Integração de componentes | — |  |
| ⬜ | [TC32](casos-de-teste.md#tc32) | HU-03 | Preencher o solicitante com os dados do usuário autenticado. | Integração de componentes | — |  |
| ✅ | [TC33](casos-de-teste.md#tc33) | HU-03 | Recusar demanda com titulo de 2 caracteres. | Integração de componentes | CT-DEM-03 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC34](casos-de-teste.md#tc34) | HU-03 | Aceitar demanda com todos os obrigatórios no tamanho mínimo. | Integração de componentes | — |  |
| ✅ | [TC35](casos-de-teste.md#tc35) | HU-03 | Recusar demanda com descricao de 4 caracteres. | Integração de componentes | CT-DEM-04 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC36](casos-de-teste.md#tc36) | HU-03 | Recusar demanda com endereco.endereco de 2 caracteres. | Integração de componentes | — |  |
| ⬜ | [TC37](casos-de-teste.md#tc37) | HU-03 | Recusar demanda sem categoria. | Integração de componentes | — |  |
| ✅ | [TC38](casos-de-teste.md#tc38) | HU-03 | Recusar demanda com categoria fora do enum. | Integração de componentes | CT-DEM-05 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC39](casos-de-teste.md#tc39) | HU-03 | Recusar demanda com prioridade fora do enum. | Integração de componentes | — |  |
| ✅ | [TC40](casos-de-teste.md#tc40) | HU-03 | Recusar criação de demanda sem autenticação. | Integração de componentes | CT-DEM-02 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC41](casos-de-teste.md#tc41) | HU-03 | Abrir a tela de detalhe com o protocolo depois de registrar a demanda. | Sistema | `e2e/tests/registrar-demanda.spec.ts` |  |
| ⬜ | [TC42](casos-de-teste.md#tc42) | HU-03 | Impedir o envio da demanda sem localização. | Sistema | — |  |
| ⬜ | [TC43](casos-de-teste.md#tc43) | HU-03 | Impedir o envio da demanda sem aceite de compartilhamento de dados. | Sistema | — |  |
| ⬜ | [TC44](casos-de-teste.md#tc44) | HU-03 | Preencher título e descrição com a sugestão da triagem depois do upload. | Componente | — |  |
| ⬜ | [TC45](casos-de-teste.md#tc45) | HU-12 | Vincular à demanda criada a foto anexada no formulário. | Sistema | — |  |
| ⬜ | [TC46](casos-de-teste.md#tc46) | HU-12 | Receber a URL da imagem ao enviar arquivo válido. | Integração de componentes | — |  |
| ⬜ | [TC47](casos-de-teste.md#tc47) | HU-12 | Recusar upload sem arquivo. | Integração de componentes | — |  |
| ⬜ | [TC48](casos-de-teste.md#tc48) | HU-12 | Recusar upload sem autenticação. | Integração de componentes | — |  |
| ⬜ | [TC49](casos-de-teste.md#tc49) | HU-08 | Usar a categoria enviada pelo frontend quando o Google Vision não está configurado. | Integração de componentes | — |  |
| ⬜ | [TC50](casos-de-teste.md#tc50) | HU-08 | Usar a categoria enviada quando o Google Vision configurado falha. | Integração de componentes | — |  |
| ⬜ | [TC51](casos-de-teste.md#tc51) | HU-03 | Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível. | Sistema | — |  |
| ✅ | [TC52](casos-de-teste.md#tc52) | HU-06 | Listar para o cidadão só as próprias demandas. | Integração de componentes | CT-DEM-07 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC53](casos-de-teste.md#tc53) | HU-06 | Listar a fila geral para gestor sem vínculo com órgão. | Integração de componentes | CT-DEM-08 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC54](casos-de-teste.md#tc54) | HU-06 | Listar para gestor vinculado só as demandas do seu órgão. | Integração de componentes | — |  |
| ✅ | [TC55](casos-de-teste.md#tc55) | HU-06 | Filtrar demandas por status. | Integração de componentes | CT-DEM-09 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC56](casos-de-teste.md#tc56) | HU-06 | Filtrar demandas por categoria. | Integração de componentes | CT-DEM-10 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC57](casos-de-teste.md#tc57) | HU-06 | Filtrar demandas por prioridade. | Integração de componentes | — |  |
| ⬜ | [TC58](casos-de-teste.md#tc58) | HU-06 | Filtrar demandas por bairro. | Integração de componentes | — |  |
| ✅ | [TC59](casos-de-teste.md#tc59) | HU-06 | Filtrar demandas por texto em busca. | Integração de componentes | CT-DEM-11 (`tests/acceptance/02_demands.test.ts`) |  |
| ⬜ | [TC60](casos-de-teste.md#tc60) | HU-06 | Combinar filtros status e categoria. | Integração de componentes | — |  |
| ⬜ | [TC61](casos-de-teste.md#tc61) | HU-06 | Recusar filtro com status fora do enum. | Integração de componentes | — |  |
| ⬜ | [TC62](casos-de-teste.md#tc62) | HU-06 | Aplicar filtro de status na tela de listagem. | Sistema | — |  |
| ⬜ | [TC63](casos-de-teste.md#tc63) | HU-06 | Exibir estado vazio na listagem de cidadão sem demandas. | Sistema | — |  |
| ⬜ | [TC64](casos-de-teste.md#tc64) | HU-06 | Exibir estado de erro na listagem quando a API está indisponível. | Sistema | — |  |
| ⬜ | [TC65](casos-de-teste.md#tc65) | HU-06 | Expor estado de carregamento enquanto a listagem está pendente. | Componente | — |  |
| ✅ | [TC66](casos-de-teste.md#tc66) | HU-04 | Consultar detalhe de demanda própria. | Integração de componentes | CT-DEM-13 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC67](casos-de-teste.md#tc67) | HU-04 | Recusar ao cidadão o detalhe de demanda de outra pessoa. | Integração de componentes | CT-DEM-14 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC68](casos-de-teste.md#tc68) | HU-04 | Retornar erro para demanda inexistente. | Integração de componentes | CT-DEM-16 (`tests/acceptance/02_demands.test.ts`) |  |
| 🟡 | [TC69](casos-de-teste.md#tc69) | HU-04 | Exibir no detalhe os seis dados exigidos da demanda. | Sistema | `e2e/tests/registrar-demanda.spec.ts` | Confere protocolo, título e status; faltam os demais dados exigidos. |
| ✅ | [TC70](casos-de-teste.md#tc70) | HU-05 | Atualizar o status da demanda como gestor. | Integração de componentes | CT-DEM-18 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC71](casos-de-teste.md#tc71) | HU-05 | Acrescentar item ao histórico ao atualizar o status. | Integração de componentes | CT-DEM-18 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC72](casos-de-teste.md#tc72) | HU-05 | Recusar atualização de status feita por cidadão. | Integração de componentes | CT-DEM-17 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC73](casos-de-teste.md#tc73) | HU-05 | Recusar atualização de status sem autenticação. | Integração de componentes | CT-DEM-21 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC74](casos-de-teste.md#tc74) | HU-05 | Recusar atualização com status fora do enum. | Integração de componentes | CT-DEM-19 (`tests/acceptance/02_demands.test.ts`) |  |
| ✅ | [TC75](casos-de-teste.md#tc75) | HU-05 | Recusar atualização de status de demanda inexistente. | Integração de componentes | CT-DEM-20 (`tests/acceptance/02_demands.test.ts`) |  |
| 🟡 | [TC76](casos-de-teste.md#tc76) | HU-05 | Percorrer o ciclo nominal de status até resolvida. | Integração de componentes | `e2e/tests/gestor-gerencia-demanda.spec.ts` | Ciclo coberto só pela UI; falta o teste de API. |
| ⬜ | [TC77](casos-de-teste.md#tc77) | HU-05 | Cancelar demanda com status registrada. | Integração de componentes | — |  |
| ✅ | [TC78](casos-de-teste.md#tc78) | HU-04 | Exibir ao cidadão o status alterado pelo gestor. | Sistema | `e2e/tests/gestor-gerencia-demanda.spec.ts` |  |
| ✅ | [TC79](casos-de-teste.md#tc79) | HU-05 | Exibir no histórico a observação registrada pelo gestor. | Sistema | `e2e/tests/gestor-gerencia-demanda.spec.ts` |  |
| 🟡 | [TC80](casos-de-teste.md#tc80) | HU-07 | Exibir no painel do gestor o total de demandas das métricas gerais. | Sistema | `e2e/tests/gestor-aceita-triagem.spec.ts` | Lê as métricas "Em análise" e "Encaminhadas", não o total. |
| ✅ | [TC81](casos-de-teste.md#tc81) | HU-07 | Exibir na fila recente a demanda criada por último. | Sistema | `e2e/tests/gestor-aceita-triagem.spec.ts` |  |
| 🟡 | [TC82](casos-de-teste.md#tc82) | HU-08 | Exibir categoria, confiança e sugestão de encaminhamento na triagem. | Sistema | `e2e/tests/gestor-aceita-triagem.spec.ts` | Confere sugestão e confiança; não confere a categoria. |
| ⬜ | [TC83](casos-de-teste.md#tc83) | HU-08 | Sugerir o órgão cujo categoriasJson contém a categoria da demanda. | Integração de componentes | — |  |
| ✅ | [TC84](casos-de-teste.md#tc84) | HU-10 | Retornar ao cidadão métricas só das próprias demandas. | Integração de componentes | CT-MET-02 (`tests/acceptance/03_metrics_and_organs.test.ts`) |  |
| ✅ | [TC85](casos-de-teste.md#tc85) | HU-07 | Retornar ao gestor métricas gerais. | Integração de componentes | CT-MET-01 (`tests/acceptance/03_metrics_and_organs.test.ts`) |  |
| ⬜ | [TC86](casos-de-teste.md#tc86) | HU-07 | Responder métricas sem Redis configurado. | Integração de componentes | — |  |
| ⬜ | [TC87](casos-de-teste.md#tc87) | HU-07 | Responder métricas com Redis configurado mas inacessível. | Integração de componentes | — |  |
| ⬜ | [TC88](casos-de-teste.md#tc88) | HU-10 | Exibir no dashboard do cidadão o total das próprias solicitações. | Sistema | — |  |
| ⬜ | [TC89](casos-de-teste.md#tc89) | HU-02 | Navegar da home para a tela de login. | Sistema | — |  |
| ⬜ | [TC90](casos-de-teste.md#tc90) | HU-01 | Navegar da home para a tela de cadastro. | Sistema | — |  |
| ⬜ | [TC91](casos-de-teste.md#tc91) | HU-06 | Navegar da home para a tela de demandas. | Sistema | — |  |
| ⬜ | [TC92](casos-de-teste.md#tc92) | HU-03 | Registrar demanda em viewport mobile sem rolagem horizontal. | Sistema | — |  |
| ⬜ | [TC93](casos-de-teste.md#tc93) | HU-03 | Registrar demanda em viewport tablet sem rolagem horizontal. | Sistema | — |  |
| ⬜ | [TC94](casos-de-teste.md#tc94) | HU-03 | Registrar demanda em viewport desktop sem rolagem horizontal. | Sistema | — |  |

## Como atualizar

Ao automatizar um caso, troque o status, preencha a coluna "Teste automatizado" com o ID do teste (CT-xxx) e o
arquivo, e ajuste o resumo.
