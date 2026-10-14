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
| E2E <nome> | `e2e/tests/<nome>.spec.ts` |

## Resumo

**Total:** 94 casos — ✅ 38 · 🟡 10 · ⬜ 46

| Nível | ✅ | 🟡 | ⬜ | Total |
| --- | --- | --- | --- | --- |
| Integração de componentes | 30 | 7 | 29 | 66 |
| Sistema | 6 | 3 | 15 | 24 |
| Componente | 2 | 0 | 2 | 4 |

## Checklist

| Status | ID | HU | Título | Nível | Teste |
| --- | --- | --- | --- | --- | --- |
| ✅ | [TC01](casos-de-teste.md#tc01) | HU-01 | Cadastrar usuário com dados válidos. | Integração | CT-AUTH-01 |
| 🟡 | [TC02](casos-de-teste.md#tc02) | HU-01 | Verificar que o cadastro cria o cookie de sessão HTTP-only. | Integração | CT-AUTH-01 |
| ⬜ | [TC03](casos-de-teste.md#tc03) | HU-01 | Atribuir o perfil cidadao quando role é omitido. | Integração | — |
| ⬜ | [TC04](casos-de-teste.md#tc04) | HU-01 | Cadastrar usuário com perfil gestor. | Integração | — |
| ⬜ | [TC05](casos-de-teste.md#tc05) | HU-01 | Recusar cadastro com role fora do enum. | Integração | — |
| 🟡 | [TC06](casos-de-teste.md#tc06) | HU-01 | Recusar cadastro com nome de 1 caractere. | Integração | CT-AUTH-03 |
| ⬜ | [TC07](casos-de-teste.md#tc07) | HU-01 | Aceitar cadastro com nome de 2 caracteres. | Integração | — |
| 🟡 | [TC08](casos-de-teste.md#tc08) | HU-01 | Recusar cadastro com senha vazia. | Integração | CT-AUTH-03 |
| ⬜ | [TC09](casos-de-teste.md#tc09) | HU-01 | Aceitar cadastro com senha de 1 caractere. | Integração | — |
| 🟡 | [TC10](casos-de-teste.md#tc10) | HU-01 | Recusar cadastro com e-mail em formato inválido. | Integração | CT-AUTH-03 |
| ✅ | [TC11](casos-de-teste.md#tc11) | HU-01 | Recusar cadastro com e-mail já cadastrado. | Integração | CT-AUTH-02 |
| ⬜ | [TC12](casos-de-teste.md#tc12) | HU-01 | Criar conta de cidadão pela tela de cadastro. | Sistema | — |
| ✅ | [TC13](casos-de-teste.md#tc13) | HU-02 | Autenticar usuário com perfil cidadão. | Integração | CT-AUTH-04, BDD login |
| ✅ | [TC14](casos-de-teste.md#tc14) | HU-02 | Autenticar usuário com perfil gestor. | Integração | CT-AUTH-05 |
| ✅ | [TC15](casos-de-teste.md#tc15) | HU-02 | Recusar login com senha incorreta. | Integração | CT-AUTH-06 |
| ✅ | [TC16](casos-de-teste.md#tc16) | HU-02 | Recusar login com e-mail não cadastrado. | Integração | CT-AUTH-07 |
| ⬜ | [TC17](casos-de-teste.md#tc17) | HU-02 | Recusar login sem o campo email. | Integração | — |
| ✅ | [TC18](casos-de-teste.md#tc18) | HU-02 | Entrar pela tela de login com perfil cidadão. | Sistema | E2E registrar-demanda |
| ✅ | [TC19](casos-de-teste.md#tc19) | HU-02 | Entrar pela tela de login com perfil gestor. | Sistema | E2E gestor-gerencia-demanda |
| ✅ | [TC20](casos-de-teste.md#tc20) | HU-02 | Guardar na sessão o token retornado pelo login. | Componente | unit session |
| ✅ | [TC21](casos-de-teste.md#tc21) | HU-02 | Enviar o token da sessão no cabeçalho Authorization das requisições. | Componente | unit api |
| ✅ | [TC22](casos-de-teste.md#tc22) | HU-02 | Recusar acesso a rota protegida sem credencial. | Integração | CT-AUTH-09 |
| ✅ | [TC23](casos-de-teste.md#tc23) | HU-02 | Recusar acesso com token adulterado. | Integração | CT-AUTH-10 |
| ⬜ | [TC24](casos-de-teste.md#tc24) | HU-02 | Recusar acesso com token expirado. | Integração | — |
| ⬜ | [TC25](casos-de-teste.md#tc25) | HU-02 | Autenticar requisição usando só o cookie de sessão. | Integração | — |
| 🟡 | [TC26](casos-de-teste.md#tc26) | HU-02 | Remover o cookie de sessão no logout. | Integração | CT-AUTH-11 |
| ✅ | [TC27](casos-de-teste.md#tc27) | SUPOSIÇÃO | Retornar erro padronizado para rota inexistente. | Integração | CT-GEN-03 |
| ✅ | [TC28](casos-de-teste.md#tc28) | HU-03 | Gerar protocolo ao criar demanda válida. | Integração | CT-DEM-01 |
| 🟡 | [TC29](casos-de-teste.md#tc29) | HU-03 | Criar a demanda com status inicial registrada. | Integração | CT-DEM-01 |
| ⬜ | [TC30](casos-de-teste.md#tc30) | HU-03 | Aplicar prioridade padrão media quando prioridade é omitida. | Integração | — |
| ⬜ | [TC31](casos-de-teste.md#tc31) | HU-03 | Aplicar bairro e cidade padrão quando omitidos. | Integração | — |
| ⬜ | [TC32](casos-de-teste.md#tc32) | HU-03 | Preencher o solicitante com os dados do usuário autenticado. | Integração | — |
| ✅ | [TC33](casos-de-teste.md#tc33) | HU-03 | Recusar demanda com titulo de 2 caracteres. | Integração | CT-DEM-03 |
| ⬜ | [TC34](casos-de-teste.md#tc34) | HU-03 | Aceitar demanda com todos os obrigatórios no tamanho mínimo. | Integração | — |
| ✅ | [TC35](casos-de-teste.md#tc35) | HU-03 | Recusar demanda com descricao de 4 caracteres. | Integração | CT-DEM-04 |
| ⬜ | [TC36](casos-de-teste.md#tc36) | HU-03 | Recusar demanda com endereco.endereco de 2 caracteres. | Integração | — |
| ⬜ | [TC37](casos-de-teste.md#tc37) | HU-03 | Recusar demanda sem categoria. | Integração | — |
| ✅ | [TC38](casos-de-teste.md#tc38) | HU-03 | Recusar demanda com categoria fora do enum. | Integração | CT-DEM-05 |
| ⬜ | [TC39](casos-de-teste.md#tc39) | HU-03 | Recusar demanda com prioridade fora do enum. | Integração | — |
| ✅ | [TC40](casos-de-teste.md#tc40) | HU-03 | Recusar criação de demanda sem autenticação. | Integração | CT-DEM-02 |
| ✅ | [TC41](casos-de-teste.md#tc41) | HU-03 | Abrir a tela de detalhe com o protocolo depois de registrar a demanda. | Sistema | E2E registrar-demanda |
| ⬜ | [TC42](casos-de-teste.md#tc42) | HU-03 | Impedir o envio da demanda sem localização. | Sistema | — |
| ⬜ | [TC43](casos-de-teste.md#tc43) | HU-03 | Impedir o envio da demanda sem aceite de compartilhamento de dados. | Sistema | — |
| ⬜ | [TC44](casos-de-teste.md#tc44) | HU-03 | Preencher título e descrição com a sugestão da triagem depois do upload. | Componente | — |
| ⬜ | [TC45](casos-de-teste.md#tc45) | HU-12 | Vincular à demanda criada a foto anexada no formulário. | Sistema | — |
| ⬜ | [TC46](casos-de-teste.md#tc46) | HU-12 | Receber a URL da imagem ao enviar arquivo válido. | Integração | — |
| ⬜ | [TC47](casos-de-teste.md#tc47) | HU-12 | Recusar upload sem arquivo. | Integração | — |
| ⬜ | [TC48](casos-de-teste.md#tc48) | HU-12 | Recusar upload sem autenticação. | Integração | — |
| ⬜ | [TC49](casos-de-teste.md#tc49) | HU-08 | Usar a categoria enviada pelo frontend quando o Google Vision não está configurado. | Integração | — |
| ⬜ | [TC50](casos-de-teste.md#tc50) | HU-08 | Usar a categoria enviada quando o Google Vision configurado falha. | Integração | — |
| ⬜ | [TC51](casos-de-teste.md#tc51) | HU-03 | Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível. | Sistema | — |
| ✅ | [TC52](casos-de-teste.md#tc52) | HU-06 | Listar para o cidadão só as próprias demandas. | Integração | CT-DEM-07 |
| ✅ | [TC53](casos-de-teste.md#tc53) | HU-06 | Listar a fila geral para gestor sem vínculo com órgão. | Integração | CT-DEM-08 |
| ⬜ | [TC54](casos-de-teste.md#tc54) | HU-06 | Listar para gestor vinculado só as demandas do seu órgão. | Integração | — |
| ✅ | [TC55](casos-de-teste.md#tc55) | HU-06 | Filtrar demandas por status. | Integração | CT-DEM-09 |
| ✅ | [TC56](casos-de-teste.md#tc56) | HU-06 | Filtrar demandas por categoria. | Integração | CT-DEM-10 |
| ⬜ | [TC57](casos-de-teste.md#tc57) | HU-06 | Filtrar demandas por prioridade. | Integração | — |
| ⬜ | [TC58](casos-de-teste.md#tc58) | HU-06 | Filtrar demandas por bairro. | Integração | — |
| ✅ | [TC59](casos-de-teste.md#tc59) | HU-06 | Filtrar demandas por texto em busca. | Integração | CT-DEM-11 |
| ⬜ | [TC60](casos-de-teste.md#tc60) | HU-06 | Combinar filtros status e categoria. | Integração | — |
| ⬜ | [TC61](casos-de-teste.md#tc61) | HU-06 | Recusar filtro com status fora do enum. | Integração | — |
| ⬜ | [TC62](casos-de-teste.md#tc62) | HU-06 | Aplicar filtro de status na tela de listagem. | Sistema | — |
| ⬜ | [TC63](casos-de-teste.md#tc63) | HU-06 | Exibir estado vazio na listagem de cidadão sem demandas. | Sistema | — |
| ⬜ | [TC64](casos-de-teste.md#tc64) | HU-06 | Exibir estado de erro na listagem quando a API está indisponível. | Sistema | — |
| ⬜ | [TC65](casos-de-teste.md#tc65) | HU-06 | Expor estado de carregamento enquanto a listagem está pendente. | Componente | — |
| ✅ | [TC66](casos-de-teste.md#tc66) | HU-04 | Consultar detalhe de demanda própria. | Integração | CT-DEM-13 |
| ✅ | [TC67](casos-de-teste.md#tc67) | HU-04 | Recusar ao cidadão o detalhe de demanda de outra pessoa. | Integração | CT-DEM-14 |
| ✅ | [TC68](casos-de-teste.md#tc68) | HU-04 | Retornar erro para demanda inexistente. | Integração | CT-DEM-16 |
| 🟡 | [TC69](casos-de-teste.md#tc69) | HU-04 | Exibir no detalhe os seis dados exigidos da demanda. | Sistema | E2E registrar-demanda |
| ✅ | [TC70](casos-de-teste.md#tc70) | HU-05 | Atualizar o status da demanda como gestor. | Integração | CT-DEM-18 |
| ✅ | [TC71](casos-de-teste.md#tc71) | HU-05 | Acrescentar item ao histórico ao atualizar o status. | Integração | CT-DEM-18 |
| ✅ | [TC72](casos-de-teste.md#tc72) | HU-05 | Recusar atualização de status feita por cidadão. | Integração | CT-DEM-17 |
| ✅ | [TC73](casos-de-teste.md#tc73) | HU-05 | Recusar atualização de status sem autenticação. | Integração | CT-DEM-21 |
| ✅ | [TC74](casos-de-teste.md#tc74) | HU-05 | Recusar atualização com status fora do enum. | Integração | CT-DEM-19 |
| ✅ | [TC75](casos-de-teste.md#tc75) | HU-05 | Recusar atualização de status de demanda inexistente. | Integração | CT-DEM-20 |
| 🟡 | [TC76](casos-de-teste.md#tc76) | HU-05 | Percorrer o ciclo nominal de status até resolvida. | Integração | E2E gestor-gerencia-demanda |
| ⬜ | [TC77](casos-de-teste.md#tc77) | HU-05 | Cancelar demanda com status registrada. | Integração | — |
| ✅ | [TC78](casos-de-teste.md#tc78) | HU-04 | Exibir ao cidadão o status alterado pelo gestor. | Sistema | E2E gestor-gerencia-demanda |
| ✅ | [TC79](casos-de-teste.md#tc79) | HU-05 | Exibir no histórico a observação registrada pelo gestor. | Sistema | E2E gestor-gerencia-demanda |
| 🟡 | [TC80](casos-de-teste.md#tc80) | HU-07 | Exibir no painel do gestor o total de demandas das métricas gerais. | Sistema | E2E gestor-aceita-triagem |
| ✅ | [TC81](casos-de-teste.md#tc81) | HU-07 | Exibir na fila recente a demanda criada por último. | Sistema | E2E gestor-aceita-triagem |
| 🟡 | [TC82](casos-de-teste.md#tc82) | HU-08 | Exibir categoria, confiança e sugestão de encaminhamento na triagem. | Sistema | E2E gestor-aceita-triagem |
| ⬜ | [TC83](casos-de-teste.md#tc83) | HU-08 | Sugerir o órgão cujo categoriasJson contém a categoria da demanda. | Integração | — |
| ✅ | [TC84](casos-de-teste.md#tc84) | HU-10 | Retornar ao cidadão métricas só das próprias demandas. | Integração | CT-MET-02 |
| ✅ | [TC85](casos-de-teste.md#tc85) | HU-07 | Retornar ao gestor métricas gerais. | Integração | CT-MET-01 |
| ⬜ | [TC86](casos-de-teste.md#tc86) | HU-07 | Responder métricas sem Redis configurado. | Integração | — |
| ⬜ | [TC87](casos-de-teste.md#tc87) | HU-07 | Responder métricas com Redis configurado mas inacessível. | Integração | — |
| ⬜ | [TC88](casos-de-teste.md#tc88) | HU-10 | Exibir no dashboard do cidadão o total das próprias solicitações. | Sistema | — |
| ⬜ | [TC89](casos-de-teste.md#tc89) | HU-02 | Navegar da home para a tela de login. | Sistema | — |
| ⬜ | [TC90](casos-de-teste.md#tc90) | HU-01 | Navegar da home para a tela de cadastro. | Sistema | — |
| ⬜ | [TC91](casos-de-teste.md#tc91) | HU-06 | Navegar da home para a tela de demandas. | Sistema | — |
| ⬜ | [TC92](casos-de-teste.md#tc92) | HU-03 | Registrar demanda em viewport mobile sem rolagem horizontal. | Sistema | — |
| ⬜ | [TC93](casos-de-teste.md#tc93) | HU-03 | Registrar demanda em viewport tablet sem rolagem horizontal. | Sistema | — |
| ⬜ | [TC94](casos-de-teste.md#tc94) | HU-03 | Registrar demanda em viewport desktop sem rolagem horizontal. | Sistema | — |

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
