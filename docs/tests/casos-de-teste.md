# Casos de Teste — Urbanize

Complementa o [plano de testes](plano-de-testes.md). Cada caso verifica uma história de
[historias-de-usuario.md](historias-de-usuario.md).

**Origem:** casos derivados na segunda rodada com IA a partir dos quatro insumos (requisitos, formato, escopo e níveis).
Prompt em [ia/prompt-rodada-2.md](ia/prompt-rodada-2.md); saída íntegra, com lacunas, matriz de alocação, tabela de
derivação e matriz de rastreabilidade, em [ia/saida-rodada-2.md](ia/saida-rodada-2.md). A primeira rodada está em
[ia/saida-rodada-1.md](ia/saida-rodada-1.md).

**Formato:** ID, HU, CA, título, pré-condições, passos, resultado esperado e pós-condições. `CA: SUPOSIÇÃO` indica que
nenhum critério de aceite sustenta o caso; o trecho do contrato de API que o sustenta, quando existe, está na matriz de
rastreabilidade.

**Total:** 94 casos — Integração de componentes: 66 · Sistema: 24 · Componente: 4. Casos com CA marcado como suposição: 32.

## Massa de dados

- {API} = http://127.0.0.1:4000/api.
- M0: API ativa em {API}. Banco migrado e seed executado (cidadao@urbanize.com/demo, gestor@urbanize.com/demo).
- M1: M0 mais os cidadãos A (cidadaoa@teste.com/demo) e B (cidadaob@teste.com/demo), criados via POST /auth/register, e as demandas abaixo. Os status foram ajustados via PATCH pelo gestor.
- D1 (de A): registrada, vias_publicas, alta, bairro "Boa Vista", título "Buraco na rua"
- D2 (de A): em_analise, coleta_de_lixo, media, bairro "Casa Forte", título "Lixo acumulado"
- D3 (de A): resolvida, iluminacao_publica, baixa, bairro "Boa Vista", título "Poste apagado"
- D4 (de B): registrada, vias_publicas, media, bairro "Boa Vista", título "Calcada quebrada"
- TOKEN_A, TOKEN_B, TOKEN_G: tokens obtidos via POST /auth/login para A, B e gestor demo.
- APP: cliente web (Expo web, ver L24) rodando e apontando para {API}.

## Índice

| ID | HU | Título | Nível |
| --- | --- | --- | --- |
| [TC01](#tc01) | HU-01 | Cadastrar usuário com dados válidos. | Integração de componentes |
| [TC02](#tc02) | HU-01 | Verificar que o cadastro cria o cookie de sessão HTTP-only. | Integração de componentes |
| [TC03](#tc03) | HU-01 | Atribuir o perfil cidadao quando role é omitido. | Integração de componentes |
| [TC04](#tc04) | HU-01 | Cadastrar usuário com perfil gestor. | Integração de componentes |
| [TC05](#tc05) | HU-01 | Recusar cadastro com role fora do enum. | Integração de componentes |
| [TC06](#tc06) | HU-01 | Recusar cadastro com nome de 1 caractere. | Integração de componentes |
| [TC07](#tc07) | HU-01 | Aceitar cadastro com nome de 2 caracteres. | Integração de componentes |
| [TC08](#tc08) | HU-01 | Recusar cadastro com senha vazia. | Integração de componentes |
| [TC09](#tc09) | HU-01 | Aceitar cadastro com senha de 1 caractere. | Integração de componentes |
| [TC10](#tc10) | HU-01 | Recusar cadastro com e-mail em formato inválido. | Integração de componentes |
| [TC11](#tc11) | HU-01 | Recusar cadastro com e-mail já cadastrado. | Integração de componentes |
| [TC12](#tc12) | HU-01 | Criar conta de cidadão pela tela de cadastro. | Sistema |
| [TC13](#tc13) | HU-02 | Autenticar usuário com perfil cidadão. | Integração de componentes |
| [TC14](#tc14) | HU-02 | Autenticar usuário com perfil gestor. | Integração de componentes |
| [TC15](#tc15) | HU-02 | Recusar login com senha incorreta. | Integração de componentes |
| [TC16](#tc16) | HU-02 | Recusar login com e-mail não cadastrado. | Integração de componentes |
| [TC17](#tc17) | HU-02 | Recusar login sem o campo email. | Integração de componentes |
| [TC18](#tc18) | HU-02 | Entrar pela tela de login com perfil cidadão. | Sistema |
| [TC19](#tc19) | HU-02 | Entrar pela tela de login com perfil gestor. | Sistema |
| [TC20](#tc20) | HU-02 | Guardar na sessão o token retornado pelo login. | Componente |
| [TC21](#tc21) | HU-02 | Enviar o token da sessão no cabeçalho Authorization das requisições. | Componente |
| [TC22](#tc22) | HU-02 | Recusar acesso a rota protegida sem credencial. | Integração de componentes |
| [TC23](#tc23) | HU-02 | Recusar acesso com token adulterado. | Integração de componentes |
| [TC24](#tc24) | HU-02 | Recusar acesso com token expirado. | Integração de componentes |
| [TC25](#tc25) | HU-02 | Autenticar requisição usando só o cookie de sessão. | Integração de componentes |
| [TC26](#tc26) | HU-02 | Remover o cookie de sessão no logout. | Integração de componentes |
| [TC27](#tc27) | SUPOSIÇÃO | Retornar erro padronizado para rota inexistente. | Integração de componentes |
| [TC28](#tc28) | HU-03 | Gerar protocolo ao criar demanda válida. | Integração de componentes |
| [TC29](#tc29) | HU-03 | Criar a demanda com status inicial registrada. | Integração de componentes |
| [TC30](#tc30) | HU-03 | Aplicar prioridade padrão media quando prioridade é omitida. | Integração de componentes |
| [TC31](#tc31) | HU-03 | Aplicar bairro e cidade padrão quando omitidos. | Integração de componentes |
| [TC32](#tc32) | HU-03 | Preencher o solicitante com os dados do usuário autenticado. | Integração de componentes |
| [TC33](#tc33) | HU-03 | Recusar demanda com titulo de 2 caracteres. | Integração de componentes |
| [TC34](#tc34) | HU-03 | Aceitar demanda com todos os obrigatórios no tamanho mínimo. | Integração de componentes |
| [TC35](#tc35) | HU-03 | Recusar demanda com descricao de 4 caracteres. | Integração de componentes |
| [TC36](#tc36) | HU-03 | Recusar demanda com endereco.endereco de 2 caracteres. | Integração de componentes |
| [TC37](#tc37) | HU-03 | Recusar demanda sem categoria. | Integração de componentes |
| [TC38](#tc38) | HU-03 | Recusar demanda com categoria fora do enum. | Integração de componentes |
| [TC39](#tc39) | HU-03 | Recusar demanda com prioridade fora do enum. | Integração de componentes |
| [TC40](#tc40) | HU-03 | Recusar criação de demanda sem autenticação. | Integração de componentes |
| [TC41](#tc41) | HU-03 | Abrir a tela de detalhe com o protocolo depois de registrar a demanda. | Sistema |
| [TC42](#tc42) | HU-03 | Impedir o envio da demanda sem localização. | Sistema |
| [TC43](#tc43) | HU-03 | Impedir o envio da demanda sem aceite de compartilhamento de dados. | Sistema |
| [TC44](#tc44) | HU-03 | Preencher título e descrição com a sugestão da triagem depois do upload. | Componente |
| [TC45](#tc45) | HU-12 | Vincular à demanda criada a foto anexada no formulário. | Sistema |
| [TC46](#tc46) | HU-12 | Receber a URL da imagem ao enviar arquivo válido. | Integração de componentes |
| [TC47](#tc47) | HU-12 | Recusar upload sem arquivo. | Integração de componentes |
| [TC48](#tc48) | HU-12 | Recusar upload sem autenticação. | Integração de componentes |
| [TC49](#tc49) | HU-08 | Usar a categoria enviada pelo frontend quando o Google Vision não está configurado. | Integração de componentes |
| [TC50](#tc50) | HU-08 | Usar a categoria enviada quando o Google Vision configurado falha. | Integração de componentes |
| [TC51](#tc51) | HU-03 | Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível. | Sistema |
| [TC52](#tc52) | HU-06 | Listar para o cidadão só as próprias demandas. | Integração de componentes |
| [TC53](#tc53) | HU-06 | Listar a fila geral para gestor sem vínculo com órgão. | Integração de componentes |
| [TC54](#tc54) | HU-06 | Listar para gestor vinculado só as demandas do seu órgão. | Integração de componentes |
| [TC55](#tc55) | HU-06 | Filtrar demandas por status. | Integração de componentes |
| [TC56](#tc56) | HU-06 | Filtrar demandas por categoria. | Integração de componentes |
| [TC57](#tc57) | HU-06 | Filtrar demandas por prioridade. | Integração de componentes |
| [TC58](#tc58) | HU-06 | Filtrar demandas por bairro. | Integração de componentes |
| [TC59](#tc59) | HU-06 | Filtrar demandas por texto em busca. | Integração de componentes |
| [TC60](#tc60) | HU-06 | Combinar filtros status e categoria. | Integração de componentes |
| [TC61](#tc61) | HU-06 | Recusar filtro com status fora do enum. | Integração de componentes |
| [TC62](#tc62) | HU-06 | Aplicar filtro de status na tela de listagem. | Sistema |
| [TC63](#tc63) | HU-06 | Exibir estado vazio na listagem de cidadão sem demandas. | Sistema |
| [TC64](#tc64) | HU-06 | Exibir estado de erro na listagem quando a API está indisponível. | Sistema |
| [TC65](#tc65) | HU-06 | Expor estado de carregamento enquanto a listagem está pendente. | Componente |
| [TC66](#tc66) | HU-04 | Consultar detalhe de demanda própria. | Integração de componentes |
| [TC67](#tc67) | HU-04 | Recusar ao cidadão o detalhe de demanda de outra pessoa. | Integração de componentes |
| [TC68](#tc68) | HU-04 | Retornar erro para demanda inexistente. | Integração de componentes |
| [TC69](#tc69) | HU-04 | Exibir no detalhe os seis dados exigidos da demanda. | Sistema |
| [TC70](#tc70) | HU-05 | Atualizar o status da demanda como gestor. | Integração de componentes |
| [TC71](#tc71) | HU-05 | Acrescentar item ao histórico ao atualizar o status. | Integração de componentes |
| [TC72](#tc72) | HU-05 | Recusar atualização de status feita por cidadão. | Integração de componentes |
| [TC73](#tc73) | HU-05 | Recusar atualização de status sem autenticação. | Integração de componentes |
| [TC74](#tc74) | HU-05 | Recusar atualização com status fora do enum. | Integração de componentes |
| [TC75](#tc75) | HU-05 | Recusar atualização de status de demanda inexistente. | Integração de componentes |
| [TC76](#tc76) | HU-05 | Percorrer o ciclo nominal de status até resolvida. | Integração de componentes |
| [TC77](#tc77) | HU-05 | Cancelar demanda com status registrada. | Integração de componentes |
| [TC78](#tc78) | HU-04 | Exibir ao cidadão o status alterado pelo gestor. | Sistema |
| [TC79](#tc79) | HU-05 | Exibir no histórico a observação registrada pelo gestor. | Sistema |
| [TC80](#tc80) | HU-07 | Exibir no painel do gestor o total de demandas das métricas gerais. | Sistema |
| [TC81](#tc81) | HU-07 | Exibir na fila recente a demanda criada por último. | Sistema |
| [TC82](#tc82) | HU-08 | Exibir categoria, confiança e sugestão de encaminhamento na triagem. | Sistema |
| [TC83](#tc83) | HU-08 | Sugerir o órgão cujo categoriasJson contém a categoria da demanda. | Integração de componentes |
| [TC84](#tc84) | HU-10 | Retornar ao cidadão métricas só das próprias demandas. | Integração de componentes |
| [TC85](#tc85) | HU-07 | Retornar ao gestor métricas gerais. | Integração de componentes |
| [TC86](#tc86) | HU-07 | Responder métricas sem Redis configurado. | Integração de componentes |
| [TC87](#tc87) | HU-07 | Responder métricas com Redis configurado mas inacessível. | Integração de componentes |
| [TC88](#tc88) | HU-10 | Exibir no dashboard do cidadão o total das próprias solicitações. | Sistema |
| [TC89](#tc89) | HU-02 | Navegar da home para a tela de login. | Sistema |
| [TC90](#tc90) | HU-01 | Navegar da home para a tela de cadastro. | Sistema |
| [TC91](#tc91) | HU-06 | Navegar da home para a tela de demandas. | Sistema |
| [TC92](#tc92) | HU-03 | Registrar demanda em viewport mobile sem rolagem horizontal. | Sistema |
| [TC93](#tc93) | HU-03 | Registrar demanda em viewport tablet sem rolagem horizontal. | Sistema |
| [TC94](#tc94) | HU-03 | Registrar demanda em viewport desktop sem rolagem horizontal. | Sistema |

## Casos

### TC01

| Campo | Conteúdo |
| --- | --- |
| ID | TC01 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Cadastrar usuário com dados válidos. |
| Pré-condições | M0. E-mail novo01@teste.com inexistente no banco. |
| Passos | 1. Enviar POST {API}/auth/register com {"nome":"Maria Silva","email":"novo01@teste.com","senha":"demo","telefone":"(81) 99999-9999","role":"cidadao"}. |
| Resultado esperado | HTTP 201 com success: true e data.user.email = novo01@teste.com. |
| Pós-condições | Usuário novo01@teste.com persistido no banco. |
| Nível | Integração de componentes |

### TC02

| Campo | Conteúdo |
| --- | --- |
| ID | TC02 |
| HU | HU-01 Cadastro de conta |
| CA | SUPOSIÇÃO |
| Título | Verificar que o cadastro cria o cookie de sessão HTTP-only. |
| Pré-condições | M0. E-mail novo02@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com nome, e-mail novo02@teste.com e senha válidos.<br>2. Ler o cabeçalho Set-Cookie da resposta. |
| Resultado esperado | Set-Cookie contém urbanize_session com o atributo HttpOnly. |
| Pós-condições | Usuário persistido. Sessão emitida. |
| Nível | Integração de componentes |

### TC03

| Campo | Conteúdo |
| --- | --- |
| ID | TC03 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Atribuir o perfil cidadao quando role é omitido. |
| Pré-condições | M0. E-mail novo03@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com nome, email, senha válidos e sem role. |
| Resultado esperado | data.user.role = cidadao. |
| Pós-condições | Usuário persistido com perfil cidadao. |
| Nível | Integração de componentes |

### TC04

| Campo | Conteúdo |
| --- | --- |
| ID | TC04 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Cadastrar usuário com perfil gestor. |
| Pré-condições | M0. E-mail novo04@teste.com inexistente. Ver L10. |
| Passos | 1. Enviar POST {API}/auth/register com dados válidos e "role":"gestor". |
| Resultado esperado | HTTP 201 com data.user.role = gestor. |
| Pós-condições | Usuário persistido com perfil gestor. |
| Nível | Integração de componentes |

### TC05

| Campo | Conteúdo |
| --- | --- |
| ID | TC05 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Recusar cadastro com role fora do enum. |
| Pré-condições | M0. E-mail novo05@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com dados válidos e "role":"admin". |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum usuário novo05@teste.com criado. |
| Nível | Integração de componentes |

### TC06

| Campo | Conteúdo |
| --- | --- |
| ID | TC06 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Recusar cadastro com nome de 1 caractere. |
| Pré-condições | M0. E-mail novo06@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com "nome":"M" e demais campos válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum usuário novo06@teste.com criado. |
| Nível | Integração de componentes |

### TC07

| Campo | Conteúdo |
| --- | --- |
| ID | TC07 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Aceitar cadastro com nome de 2 caracteres. |
| Pré-condições | M0. E-mail novo07@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com "nome":"Ma" e demais campos válidos. |
| Resultado esperado | HTTP 201 com data.user.nome = Ma. |
| Pós-condições | Usuário persistido. |
| Nível | Integração de componentes |

### TC08

| Campo | Conteúdo |
| --- | --- |
| ID | TC08 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Recusar cadastro com senha vazia. |
| Pré-condições | M0. E-mail novo08@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com "senha":"" e demais campos válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum usuário novo08@teste.com criado. |
| Nível | Integração de componentes |

### TC09

| Campo | Conteúdo |
| --- | --- |
| ID | TC09 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Aceitar cadastro com senha de 1 caractere. |
| Pré-condições | M0. E-mail novo09@teste.com inexistente. |
| Passos | 1. Enviar POST {API}/auth/register com "senha":"a" e demais campos válidos. |
| Resultado esperado | HTTP 201 com success: true. |
| Pós-condições | Usuário persistido. |
| Nível | Integração de componentes |

### TC10

| Campo | Conteúdo |
| --- | --- |
| ID | TC10 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Recusar cadastro com e-mail em formato inválido. |
| Pré-condições | M0. |
| Passos | 1. Enviar POST {API}/auth/register com "email":"maria.teste.com" e demais campos válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum usuário criado. |
| Nível | Integração de componentes |

### TC11

| Campo | Conteúdo |
| --- | --- |
| ID | TC11 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Recusar cadastro com e-mail já cadastrado. |
| Pré-condições | M0. Usuário cidadao@urbanize.com existente. |
| Passos | 1. Enviar POST {API}/auth/register com "email":"cidadao@urbanize.com" e demais campos válidos. |
| Resultado esperado | HTTP 409 com error.code = EMAIL_ALREADY_EXISTS. |
| Pós-condições | Continua existindo um único usuário com esse e-mail, sem alteração. |
| Nível | Integração de componentes |

### TC12

| Campo | Conteúdo |
| --- | --- |
| ID | TC12 |
| HU | HU-01 Cadastro de conta |
| CA | CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." |
| Título | Criar conta de cidadão pela tela de cadastro. |
| Pré-condições | M0, APP. E-mail novo12@teste.com inexistente. Navegador sem sessão. |
| Passos | 1. Abrir a tela de cadastro no APP.<br>2. Informar nome "Maria Silva", e-mail novo12@teste.com, senha "demo" e perfil cidadão.<br>3. Enviar o formulário.<br>4. Enviar POST {API}/auth/login com novo12@teste.com/demo. |
| Resultado esperado | O login do passo 4 retorna HTTP 200 com data.user.role = cidadao. |
| Pós-condições | Usuário novo12@teste.com persistido. |
| Nível | Sistema |

### TC13

| Campo | Conteúdo |
| --- | --- |
| ID | TC13 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Autenticar usuário com perfil cidadão. |
| Pré-condições | M0. |
| Passos | 1. Enviar POST {API}/auth/login com {"email":"cidadao@urbanize.com","senha":"demo"}. |
| Resultado esperado | HTTP 200 com data.user.role = cidadao e data.token não vazio. |
| Pós-condições | Sessão emitida. Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC14

| Campo | Conteúdo |
| --- | --- |
| ID | TC14 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Autenticar usuário com perfil gestor. |
| Pré-condições | M0. |
| Passos | 1. Enviar POST {API}/auth/login com {"email":"gestor@urbanize.com","senha":"demo"}. |
| Resultado esperado | HTTP 200 com data.user.role = gestor e data.token não vazio. |
| Pós-condições | Sessão emitida. Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC15

| Campo | Conteúdo |
| --- | --- |
| ID | TC15 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Recusar login com senha incorreta. |
| Pré-condições | M0. |
| Passos | 1. Enviar POST {API}/auth/login com {"email":"cidadao@urbanize.com","senha":"errada"}. |
| Resultado esperado | HTTP 401 com error.code = INVALID_CREDENTIALS. |
| Pós-condições | Nenhum cookie de sessão emitido. |
| Nível | Integração de componentes |

### TC16

| Campo | Conteúdo |
| --- | --- |
| ID | TC16 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Recusar login com e-mail não cadastrado. |
| Pré-condições | M0. E-mail inexistente@teste.com não cadastrado. |
| Passos | 1. Enviar POST {API}/auth/login com {"email":"inexistente@teste.com","senha":"demo"}. |
| Resultado esperado | HTTP 401 com error.code = INVALID_CREDENTIALS. |
| Pós-condições | Nenhum cookie de sessão emitido. |
| Nível | Integração de componentes |

### TC17

| Campo | Conteúdo |
| --- | --- |
| ID | TC17 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Recusar login sem o campo email. |
| Pré-condições | M0. SUPOSIÇÃO: os campos do login são obrigatórios (não declarado). |
| Passos | 1. Enviar POST {API}/auth/login com {"senha":"demo"}. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum cookie de sessão emitido. |
| Nível | Integração de componentes |

### TC18

| Campo | Conteúdo |
| --- | --- |
| ID | TC18 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Entrar pela tela de login com perfil cidadão. |
| Pré-condições | M0, APP. Navegador sem sessão. SUPOSIÇÃO: o destino depois do login do cidadão é o dashboard do cidadão (L29). |
| Passos | 1. Abrir a tela de login.<br>2. Informar cidadao@urbanize.com/demo.<br>3. Enviar. |
| Resultado esperado | O APP exibe o dashboard do cidadão. |
| Pós-condições | Sessão de cidadão ativa no navegador. |
| Nível | Sistema |

### TC19

| Campo | Conteúdo |
| --- | --- |
| ID | TC19 |
| HU | HU-02 Login |
| CA | CA-02 "O login deve permitir entrada com perfis de cidadão e gestor." |
| Título | Entrar pela tela de login com perfil gestor. |
| Pré-condições | M0, APP. Navegador sem sessão. SUPOSIÇÃO: o destino depois do login do gestor é o painel do gestor (L29). |
| Passos | 1. Abrir a tela de login.<br>2. Informar gestor@urbanize.com/demo.<br>3. Enviar. |
| Resultado esperado | O APP exibe o painel do gestor. |
| Pós-condições | Sessão de gestor ativa no navegador. |
| Nível | Sistema |

### TC20

| Campo | Conteúdo |
| --- | --- |
| ID | TC20 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Guardar na sessão o token retornado pelo login. |
| Pré-condições | HTTP mockado: POST /auth/login responde 200 com data.token = jwt-teste. Sessão vazia. SUPOSIÇÃO: authService persiste o token em session. |
| Passos | 1. Chamar authService.login("cidadao@urbanize.com","demo").<br>2. Ler o token de session. |
| Resultado esperado | O token lido é jwt-teste. |
| Pós-condições | session contém o token jwt-teste. |
| Nível | Componente |

### TC21

| Campo | Conteúdo |
| --- | --- |
| ID | TC21 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Enviar o token da sessão no cabeçalho Authorization das requisições. |
| Pré-condições | session contém o token jwt-teste. HTTP mockado para GET /demands. SUPOSIÇÃO: o app usa Bearer e não só cookie. |
| Passos | 1. Chamar o método de listagem de demandas do serviço api.<br>2. Capturar a requisição no mock. |
| Resultado esperado | A requisição contém Authorization: Bearer jwt-teste. |
| Pós-condições | session inalterada. |
| Nível | Componente |

### TC22

| Campo | Conteúdo |
| --- | --- |
| ID | TC22 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Recusar acesso a rota protegida sem credencial. |
| Pré-condições | M0. |
| Passos | 1. Enviar GET {API}/auth/me sem cookie e sem Authorization. |
| Resultado esperado | HTTP 401 com error.code = UNAUTHENTICATED. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC23

| Campo | Conteúdo |
| --- | --- |
| ID | TC23 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Recusar acesso com token adulterado. |
| Pré-condições | M0. TOKEN_A com o último caractere da assinatura alterado. |
| Passos | 1. Enviar GET {API}/auth/me com Authorization: Bearer <token adulterado>. |
| Resultado esperado | HTTP 401 com error.code = INVALID_TOKEN. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC24

| Campo | Conteúdo |
| --- | --- |
| ID | TC24 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Recusar acesso com token expirado. |
| Pré-condições | API iniciada com JWT_EXPIRES_IN=1s. Token do cidadão demo obtido via login. Aguardar 2 segundos. |
| Passos | 1. Enviar GET {API}/auth/me com o token expirado. |
| Resultado esperado | HTTP 401 com error.code = INVALID_TOKEN. |
| Pós-condições | Nenhum dado alterado. Restaurar JWT_EXPIRES_IN padrão. |
| Nível | Integração de componentes |

### TC25

| Campo | Conteúdo |
| --- | --- |
| ID | TC25 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Autenticar requisição usando só o cookie de sessão. |
| Pré-condições | M0. Cookie urbanize_session obtido via login do cidadão demo. |
| Passos | 1. Enviar GET {API}/auth/me só com o cookie, sem Authorization. |
| Resultado esperado | HTTP 200 com data.user.email = cidadao@urbanize.com. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC26

| Campo | Conteúdo |
| --- | --- |
| ID | TC26 |
| HU | HU-02 Login |
| CA | SUPOSIÇÃO |
| Título | Remover o cookie de sessão no logout. |
| Pré-condições | M0. Cookie urbanize_session válido. |
| Passos | 1. Enviar POST {API}/auth/logout com o cookie.<br>2. Ler o cabeçalho Set-Cookie. |
| Resultado esperado | Set-Cookie limpa urbanize_session (valor vazio ou expiração no passado). |
| Pós-condições | Navegador ou cliente sem cookie de sessão válido. |
| Nível | Integração de componentes |

### TC27

| Campo | Conteúdo |
| --- | --- |
| ID | TC27 |
| HU | SUPOSIÇÃO (nenhuma HU. Regra do contrato de API) |
| CA | SUPOSIÇÃO |
| Título | Retornar erro padronizado para rota inexistente. |
| Pré-condições | M0. |
| Passos | 1. Enviar GET {API}/rota-inexistente com TOKEN_A. |
| Resultado esperado | HTTP 404 com error.code = NOT_FOUND. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC28

| Campo | Conteúdo |
| --- | --- |
| ID | TC28 |
| HU | HU-03 Registro de demanda |
| CA | CA-05 "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe." |
| Título | Gerar protocolo ao criar demanda válida. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/demands com o corpo de exemplo do contrato (titulo "Buraco na rua", descricao "Buraco grande causando risco para motos.", categoria vias_publicas, prioridade alta, endereco.endereco "Rua Exemplo, 100"). |
| Resultado esperado | HTTP 201 com data.protocolo não vazio. |
| Pós-condições | Demanda persistida e vinculada ao cidadão A. |
| Nível | Integração de componentes |

### TC29

| Campo | Conteúdo |
| --- | --- |
| ID | TC29 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Criar a demanda com status inicial registrada. |
| Pré-condições | M1. TOKEN_A. SUPOSIÇÃO: o status inicial é registrada (L05). |
| Passos | 1. Enviar POST {API}/demands com os campos obrigatórios válidos. |
| Resultado esperado | data.status = registrada. |
| Pós-condições | Demanda persistida com status registrada. |
| Nível | Integração de componentes |

### TC30

| Campo | Conteúdo |
| --- | --- |
| ID | TC30 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Aplicar prioridade padrão media quando prioridade é omitida. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/demands só com titulo, descricao, categoria e endereco.endereco válidos. |
| Resultado esperado | data.prioridade = media. |
| Pós-condições | Demanda persistida com prioridade media. |
| Nível | Integração de componentes |

### TC31

| Campo | Conteúdo |
| --- | --- |
| ID | TC31 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Aplicar bairro e cidade padrão quando omitidos. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/demands com endereco contendo só endereco = "Rua Exemplo, 100" e demais obrigatórios válidos. |
| Resultado esperado | data.endereco retorna bairro = Nao informado e cidade = Recife. |
| Pós-condições | Demanda persistida com os valores padrão de endereço. |
| Nível | Integração de componentes |

### TC32

| Campo | Conteúdo |
| --- | --- |
| ID | TC32 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Preencher o solicitante com os dados do usuário autenticado. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/demands sem nomeSolicitante e sem emailSolicitante, com os obrigatórios válidos. |
| Resultado esperado | data.emailSolicitante = cidadaoa@teste.com e data.nomeSolicitante = nome cadastrado de A. |
| Pós-condições | Demanda persistida com os dados do solicitante de A. |
| Nível | Integração de componentes |

### TC33

| Campo | Conteúdo |
| --- | --- |
| ID | TC33 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar demanda com titulo de 2 caracteres. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com "titulo":"Bu" e demais obrigatórios válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC34

| Campo | Conteúdo |
| --- | --- |
| ID | TC34 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Aceitar demanda com todos os obrigatórios no tamanho mínimo. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/demands com "titulo":"Bur", "descricao":"Grand", "categoria":"vias_publicas", "endereco":{"endereco":"R 1"}. |
| Resultado esperado | HTTP 201 com success: true. |
| Pós-condições | Demanda persistida. |
| Nível | Integração de componentes |

### TC35

| Campo | Conteúdo |
| --- | --- |
| ID | TC35 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar demanda com descricao de 4 caracteres. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com "descricao":"Gran" e demais obrigatórios válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC36

| Campo | Conteúdo |
| --- | --- |
| ID | TC36 |
| HU | HU-03 Registro de demanda |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Recusar demanda com endereco.endereco de 2 caracteres. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com "endereco":{"endereco":"R1"} e demais obrigatórios válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC37

| Campo | Conteúdo |
| --- | --- |
| ID | TC37 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar demanda sem categoria. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com os demais obrigatórios válidos e sem categoria. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC38

| Campo | Conteúdo |
| --- | --- |
| ID | TC38 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar demanda com categoria fora do enum. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com "categoria":"transito" e demais obrigatórios válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC39

| Campo | Conteúdo |
| --- | --- |
| ID | TC39 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar demanda com prioridade fora do enum. |
| Pré-condições | M1. TOKEN_A. Contagem de demandas de A = 3. |
| Passos | 1. Enviar POST {API}/demands com "prioridade":"urgente" e demais obrigatórios válidos. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Contagem de demandas de A continua 3. |
| Nível | Integração de componentes |

### TC40

| Campo | Conteúdo |
| --- | --- |
| ID | TC40 |
| HU | HU-03 Registro de demanda |
| CA | SUPOSIÇÃO |
| Título | Recusar criação de demanda sem autenticação. |
| Pré-condições | M1. Contagem total de demandas = N. |
| Passos | 1. Enviar POST {API}/demands com corpo válido, sem cookie e sem Authorization. |
| Resultado esperado | HTTP 401 com error.code = UNAUTHENTICATED. |
| Pós-condições | Contagem total de demandas continua N. |
| Nível | Integração de componentes |

### TC41

| Campo | Conteúdo |
| --- | --- |
| ID | TC41 |
| HU | HU-03 Registro de demanda |
| CA | CA-05 "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe." |
| Título | Abrir a tela de detalhe com o protocolo depois de registrar a demanda. |
| Pré-condições | M1, APP. Cidadão A logado no APP. |
| Passos | 1. Abrir o formulário de nova demanda.<br>2. Informar título "Buraco na rua", descrição "Buraco grande causando risco para motos.", categoria vias públicas, prioridade alta e localização "Rua Exemplo, 100".<br>3. Marcar o aceite de compartilhamento de dados.<br>4. Enviar. |
| Resultado esperado | O APP exibe a tela de detalhe com o mesmo protocolo retornado por POST /demands. |
| Pós-condições | Nova demanda de A persistida. |
| Nível | Sistema |

### TC42

| Campo | Conteúdo |
| --- | --- |
| ID | TC42 |
| HU | HU-03 Registro de demanda |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Impedir o envio da demanda sem localização. |
| Pré-condições | M1, APP. Cidadão A logado. Monitoramento de rede ativo no Playwright. |
| Passos | 1. Abrir o formulário de nova demanda.<br>2. Preencher título, descrição e categoria válidos.<br>3. Deixar a localização vazia.<br>4. Marcar o aceite.<br>5. Acionar o envio. |
| Resultado esperado | Nenhuma requisição POST /demands é disparada. |
| Pós-condições | Contagem de demandas de A inalterada. Formulário continua aberto com os dados preenchidos. |
| Nível | Sistema |

### TC43

| Campo | Conteúdo |
| --- | --- |
| ID | TC43 |
| HU | HU-03 Registro de demanda |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Impedir o envio da demanda sem aceite de compartilhamento de dados. |
| Pré-condições | M1, APP. Cidadão A logado. Monitoramento de rede ativo. |
| Passos | 1. Abrir o formulário de nova demanda.<br>2. Preencher título, descrição, categoria e localização válidos.<br>3. Não marcar o aceite.<br>4. Acionar o envio. |
| Resultado esperado | Nenhuma requisição POST /demands é disparada. |
| Pós-condições | Contagem de demandas de A inalterada. Formulário continua aberto. |
| Nível | Sistema |

### TC44

| Campo | Conteúdo |
| --- | --- |
| ID | TC44 |
| HU | HU-03 Registro de demanda |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Preencher título e descrição com a sugestão da triagem depois do upload. |
| Pré-condições | HTTP mockado: POST /upload/image responde 200 com triagem.tituloSugerido = "Buraco na rua" e triagem.descricaoSugerida = "Imagem analisada automaticamente.". Hook do formulário com título e descrição vazios. |
| Passos | 1. Acionar a função de upload do hook com um arquivo foto.jpg.<br>2. Aguardar a resolução da promessa.<br>3. Ler o estado de título e descrição. |
| Resultado esperado | Título = "Buraco na rua" e descrição = "Imagem analisada automaticamente.". |
| Pós-condições | Estado do formulário com imagemUrl do mock guardado. |
| Nível | Componente |

### TC45

| Campo | Conteúdo |
| --- | --- |
| ID | TC45 |
| HU | HU-12 Anexar fotos |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Vincular à demanda criada a foto anexada no formulário. |
| Pré-condições | M1, APP. Cidadão A logado. Arquivo foto.jpg disponível. GOOGLE_VISION_CREDENTIALS vazio. |
| Passos | 1. Abrir o formulário de nova demanda.<br>2. Anexar foto.jpg.<br>3. Preencher os campos obrigatórios, a localização e o aceite.<br>4. Enviar.<br>5. Enviar GET {API}/demands/:id da demanda criada com TOKEN_A. |
| Resultado esperado | data.imagemUrl da demanda é não vazio e começa com /uploads/. |
| Pós-condições | Demanda e arquivo de imagem persistidos. |
| Nível | Sistema |

### TC46

| Campo | Conteúdo |
| --- | --- |
| ID | TC46 |
| HU | HU-12 Anexar fotos |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Receber a URL da imagem ao enviar arquivo válido. |
| Pré-condições | M1. TOKEN_A. Arquivo foto.jpg válido. |
| Passos | 1. Enviar POST {API}/upload/image (multipart) com imagem=@foto.jpg e categoria=vias_publicas. |
| Resultado esperado | HTTP 200 com data.imageUrl começando com /uploads/. |
| Pós-condições | Arquivo gravado no armazenamento de uploads. |
| Nível | Integração de componentes |

### TC47

| Campo | Conteúdo |
| --- | --- |
| ID | TC47 |
| HU | HU-12 Anexar fotos |
| CA | SUPOSIÇÃO |
| Título | Recusar upload sem arquivo. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar POST {API}/upload/image (multipart) só com categoria=vias_publicas. |
| Resultado esperado | HTTP 400 com error.code = NO_FILE. |
| Pós-condições | Nenhum arquivo gravado. |
| Nível | Integração de componentes |

### TC48

| Campo | Conteúdo |
| --- | --- |
| ID | TC48 |
| HU | HU-12 Anexar fotos |
| CA | SUPOSIÇÃO |
| Título | Recusar upload sem autenticação. |
| Pré-condições | M1. Arquivo foto.jpg. |
| Passos | 1. Enviar POST {API}/upload/image com imagem=@foto.jpg, sem cookie e sem Authorization. |
| Resultado esperado | HTTP 401 com error.code = UNAUTHENTICATED. |
| Pós-condições | Nenhum arquivo gravado. |
| Nível | Integração de componentes |

### TC49

| Campo | Conteúdo |
| --- | --- |
| ID | TC49 |
| HU | HU-08 Revisão da triagem |
| CA | SUPOSIÇÃO |
| Título | Usar a categoria enviada pelo frontend quando o Google Vision não está configurado. |
| Pré-condições | API iniciada com GOOGLE_VISION_CREDENTIALS vazio. M1. TOKEN_A. Arquivo foto.jpg. |
| Passos | 1. Enviar POST {API}/upload/image com imagem=@foto.jpg e categoria=zeladoria. |
| Resultado esperado | data.triagem.categoria = zeladoria. |
| Pós-condições | Arquivo gravado. Nenhuma chamada ao Google Vision. |
| Nível | Integração de componentes |

### TC50

| Campo | Conteúdo |
| --- | --- |
| ID | TC50 |
| HU | HU-08 Revisão da triagem |
| CA | SUPOSIÇÃO |
| Título | Usar a categoria enviada quando o Google Vision configurado falha. |
| Pré-condições | API iniciada com GOOGLE_VISION_CREDENTIALS contendo credencial inválida. M1. TOKEN_A. SUPOSIÇÃO: falha do Vision segue o mesmo fallback do "não configurado" (L20). |
| Passos | 1. Enviar POST {API}/upload/image com imagem=@foto.jpg e categoria=saneamento. |
| Resultado esperado | HTTP 200 com data.triagem.categoria = saneamento. |
| Pós-condições | Arquivo gravado. API continua ativa (GET /health responde ok). |
| Nível | Integração de componentes |

### TC51

| Campo | Conteúdo |
| --- | --- |
| ID | TC51 |
| HU | HU-03 Registro de demanda |
| CA | CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados." |
| Título | Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível. |
| Pré-condições | API com GOOGLE_VISION_CREDENTIALS vazio. M1, APP. Cidadão A logado. |
| Passos | 1. Abrir o formulário de nova demanda.<br>2. Selecionar a categoria zeladoria.<br>3. Anexar foto.jpg.<br>4. Preencher título, descrição, localização e aceite.<br>5. Enviar.<br>6. Enviar GET {API}/demands/:id da demanda criada com TOKEN_A. |
| Resultado esperado | data.categoria = zeladoria. |
| Pós-condições | Demanda persistida com a categoria zeladoria. |
| Nível | Sistema |

### TC52

| Campo | Conteúdo |
| --- | --- |
| ID | TC52 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Listar para o cidadão só as próprias demandas. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands com TOKEN_A. |
| Resultado esperado | data contém exatamente D1, D2 e D3 (sem D4). |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC53

| Campo | Conteúdo |
| --- | --- |
| ID | TC53 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Listar a fila geral para gestor sem vínculo com órgão. |
| Pré-condições | M1. TOKEN_G. SUPOSIÇÃO: gestor@urbanize.com do seed não tem órgão (L09). |
| Passos | 1. Enviar GET {API}/demands com TOKEN_G. |
| Resultado esperado | data contém D1, D2, D3 e D4. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC54

| Campo | Conteúdo |
| --- | --- |
| ID | TC54 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Listar para gestor vinculado só as demandas do seu órgão. |
| Pré-condições | M1. Gestor G2 vinculado ao órgão "Secretaria de Obras" direto no banco. D1 vinculada a esse órgão e D2 a outro. Token de G2. SUPOSIÇÃO: forma do vínculo gestor↔órgão e demanda↔órgão (L09). |
| Passos | 1. Enviar GET {API}/demands com o token de G2. |
| Resultado esperado | data contém D1 e não contém D2. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC55

| Campo | Conteúdo |
| --- | --- |
| ID | TC55 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Filtrar demandas por status. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands?status=em_analise com TOKEN_A. |
| Resultado esperado | data contém só D2. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC56

| Campo | Conteúdo |
| --- | --- |
| ID | TC56 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Filtrar demandas por categoria. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands?categoria=vias_publicas com TOKEN_A. |
| Resultado esperado | data contém só D1. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC57

| Campo | Conteúdo |
| --- | --- |
| ID | TC57 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Filtrar demandas por prioridade. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands?prioridade=baixa com TOKEN_A. |
| Resultado esperado | data contém só D3. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC58

| Campo | Conteúdo |
| --- | --- |
| ID | TC58 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Filtrar demandas por bairro. |
| Pré-condições | M1. TOKEN_A. SUPOSIÇÃO: bairro compara igualdade exata (L17). |
| Passos | 1. Enviar GET {API}/demands?bairro=Boa%20Vista com TOKEN_A. |
| Resultado esperado | data contém só D1 e D3. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC59

| Campo | Conteúdo |
| --- | --- |
| ID | TC59 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Filtrar demandas por texto em busca. |
| Pré-condições | M1. TOKEN_A. SUPOSIÇÃO: busca procura no título (L17). |
| Passos | 1. Enviar GET {API}/demands?busca=Poste com TOKEN_A. |
| Resultado esperado | data contém só D3. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC60

| Campo | Conteúdo |
| --- | --- |
| ID | TC60 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Combinar filtros status e categoria. |
| Pré-condições | M1. TOKEN_G (fila geral). SUPOSIÇÃO: filtros combinam com E (L17). |
| Passos | 1. Enviar GET {API}/demands?status=registrada&categoria=vias_publicas com TOKEN_G. |
| Resultado esperado | data contém D1 e D4 e nenhuma demanda com status diferente de registrada ou categoria diferente de vias_publicas. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC61

| Campo | Conteúdo |
| --- | --- |
| ID | TC61 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Recusar filtro com status fora do enum. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands?status=aberta com TOKEN_A. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC62

| Campo | Conteúdo |
| --- | --- |
| ID | TC62 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente." |
| Título | Aplicar filtro de status na tela de listagem. |
| Pré-condições | M1, APP. Cidadão A logado. |
| Passos | 1. Abrir a listagem de demandas.<br>2. Selecionar o filtro de status "em análise".<br>3. Aplicar. |
| Resultado esperado | A lista exibe só a demanda D2. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC63

| Campo | Conteúdo |
| --- | --- |
| ID | TC63 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio." |
| Título | Exibir estado vazio na listagem de cidadão sem demandas. |
| Pré-condições | M0, APP. Cidadão C (cidadaoc@teste.com) recém-cadastrado, sem demandas, logado. |
| Passos | 1. Abrir a listagem de demandas. |
| Resultado esperado | O APP exibe indicação de lista vazia no lugar de itens. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC64

| Campo | Conteúdo |
| --- | --- |
| ID | TC64 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio." |
| Título | Exibir estado de erro na listagem quando a API está indisponível. |
| Pré-condições | M1, APP. Cidadão A logado. Processo da API encerrado. |
| Passos | 1. Abrir a listagem de demandas. |
| Resultado esperado | O APP exibe indicação de erro no lugar da lista. |
| Pós-condições | Nenhum dado alterado. Reiniciar a API. |
| Nível | Sistema |

### TC65

| Campo | Conteúdo |
| --- | --- |
| ID | TC65 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio." |
| Título | Expor estado de carregamento enquanto a listagem está pendente. |
| Pré-condições | HTTP mockado: GET /demands com promessa não resolvida. |
| Passos | 1. Montar o hook de listagem de demandas.<br>2. Ler o estado de carregamento antes de resolver o mock. |
| Resultado esperado | Estado de carregamento = verdadeiro. |
| Pós-condições | Resolver o mock. O hook sai do estado de carregamento. |
| Nível | Componente |

### TC66

| Campo | Conteúdo |
| --- | --- |
| ID | TC66 |
| HU | HU-04 Acompanhar status e histórico |
| CA | CA-07 "A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico." |
| Título | Consultar detalhe de demanda própria. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/demands/{id de D1} com TOKEN_A. |
| Resultado esperado | HTTP 200 com data.protocolo igual ao protocolo de D1. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC67

| Campo | Conteúdo |
| --- | --- |
| ID | TC67 |
| HU | HU-04 Acompanhar status e histórico |
| CA | SUPOSIÇÃO |
| Título | Recusar ao cidadão o detalhe de demanda de outra pessoa. |
| Pré-condições | M1. TOKEN_A. Código HTTP esperado indefinido (L07). |
| Passos | 1. Enviar GET {API}/demands/{id de D4} com TOKEN_A. |
| Resultado esperado | Resposta com success: false e sem os dados de D4. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC68

| Campo | Conteúdo |
| --- | --- |
| ID | TC68 |
| HU | HU-04 Acompanhar status e histórico |
| CA | SUPOSIÇÃO |
| Título | Retornar erro para demanda inexistente. |
| Pré-condições | M1. TOKEN_A. ID inexistente123 não cadastrado. |
| Passos | 1. Enviar GET {API}/demands/inexistente123 com TOKEN_A. |
| Resultado esperado | HTTP 404 com error.code = DEMAND_NOT_FOUND. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC69

| Campo | Conteúdo |
| --- | --- |
| ID | TC69 |
| HU | HU-04 Acompanhar status e histórico |
| CA | CA-07 "A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico." |
| Título | Exibir no detalhe os seis dados exigidos da demanda. |
| Pré-condições | M1, APP. Cidadão A logado. D2 com pelo menos 1 item de histórico. |
| Passos | 1. Abrir a listagem.<br>2. Abrir o detalhe de D2. |
| Resultado esperado | A tela exibe protocolo, descrição, localização, prioridade, status e histórico de D2, iguais a GET /demands/{id de D2}. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC70

| Campo | Conteúdo |
| --- | --- |
| ID | TC70 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Atualizar o status da demanda como gestor. |
| Pré-condições | M1. TOKEN_G. D1 com status registrada. |
| Passos | 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"em_atendimento","observacaoGestor":"Equipe acionada para vistoria."} e TOKEN_G. |
| Resultado esperado | HTTP 200 com data.status = em_atendimento. |
| Pós-condições | D1 persistida com status em_atendimento. |
| Nível | Integração de componentes |

### TC71

| Campo | Conteúdo |
| --- | --- |
| ID | TC71 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Acrescentar item ao histórico ao atualizar o status. |
| Pré-condições | M1. TOKEN_G. D2 com historico de tamanho H (lido via GET). |
| Passos | 1. Enviar PATCH {API}/demands/{id de D2}/status com {"status":"encaminhada","observacaoGestor":"Enviado a SEOB."} e TOKEN_G. |
| Resultado esperado | data.historico tem tamanho H+1. |
| Pós-condições | Histórico de D2 persistido com o novo item. |
| Nível | Integração de componentes |

### TC72

| Campo | Conteúdo |
| --- | --- |
| ID | TC72 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Recusar atualização de status feita por cidadão. |
| Pré-condições | M1. TOKEN_A. D1 com status registrada. |
| Passos | 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"resolvida"} e TOKEN_A. |
| Resultado esperado | HTTP 403 com error.code = FORBIDDEN. |
| Pós-condições | D1 continua registrada, com histórico inalterado. |
| Nível | Integração de componentes |

### TC73

| Campo | Conteúdo |
| --- | --- |
| ID | TC73 |
| HU | HU-05 Atualização de status |
| CA | SUPOSIÇÃO |
| Título | Recusar atualização de status sem autenticação. |
| Pré-condições | M1. D1 com status registrada. |
| Passos | 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"resolvida"}, sem cookie e sem Authorization. |
| Resultado esperado | HTTP 401 com error.code = UNAUTHENTICATED. |
| Pós-condições | D1 continua registrada. |
| Nível | Integração de componentes |

### TC74

| Campo | Conteúdo |
| --- | --- |
| ID | TC74 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Recusar atualização com status fora do enum. |
| Pré-condições | M1. TOKEN_G. D1 com status registrada. |
| Passos | 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"finalizada"} e TOKEN_G. |
| Resultado esperado | HTTP 422 com error.code = VALIDATION_ERROR. |
| Pós-condições | D1 continua registrada, com histórico inalterado. |
| Nível | Integração de componentes |

### TC75

| Campo | Conteúdo |
| --- | --- |
| ID | TC75 |
| HU | HU-05 Atualização de status |
| CA | SUPOSIÇÃO |
| Título | Recusar atualização de status de demanda inexistente. |
| Pré-condições | M1. TOKEN_G. ID inexistente123 não cadastrado. |
| Passos | 1. Enviar PATCH {API}/demands/inexistente123/status com {"status":"em_analise"} e TOKEN_G. |
| Resultado esperado | HTTP 404 com error.code = DEMAND_NOT_FOUND. |
| Pós-condições | Nenhuma demanda criada ou alterada. |
| Nível | Integração de componentes |

### TC76

| Campo | Conteúdo |
| --- | --- |
| ID | TC76 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Percorrer o ciclo nominal de status até resolvida. |
| Pré-condições | M1. TOKEN_G. Nova demanda D5 de A com status registrada. SUPOSIÇÃO: a ordem do enum é o fluxo nominal permitido (L05). |
| Passos | 1. PATCH D5 para em_analise.<br>2. PATCH D5 para encaminhada.<br>3. PATCH D5 para em_atendimento.<br>4. PATCH D5 para resolvida.<br>5. Enviar GET {API}/demands/{id de D5} com TOKEN_G. |
| Resultado esperado | data.status = resolvida. |
| Pós-condições | D5 persistida como resolvida, com 4 itens de histórico acrescentados. |
| Nível | Integração de componentes |

### TC77

| Campo | Conteúdo |
| --- | --- |
| ID | TC77 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Cancelar demanda com status registrada. |
| Pré-condições | M1. TOKEN_G. Nova demanda D6 de A com status registrada. SUPOSIÇÃO: registrada→cancelada é permitida (L05). |
| Passos | 1. Enviar PATCH {API}/demands/{id de D6}/status com {"status":"cancelada","observacaoGestor":"Duplicada."} e TOKEN_G. |
| Resultado esperado | HTTP 200 com data.status = cancelada. |
| Pós-condições | D6 persistida como cancelada. |
| Nível | Integração de componentes |

### TC78

| Campo | Conteúdo |
| --- | --- |
| ID | TC78 |
| HU | HU-04 Acompanhar status e histórico |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Exibir ao cidadão o status alterado pelo gestor. |
| Pré-condições | M1, APP. D1 com status registrada. Gestor demo logado. |
| Passos | 1. Gestor abre D1 pelo painel.<br>2. Seleciona o status "em atendimento".<br>3. Informa a observação "Equipe acionada para vistoria.".<br>4. Salva.<br>5. Sair.<br>6. Entrar como cidadão A.<br>7. Abrir o detalhe de D1. |
| Resultado esperado | O detalhe de D1 exibe o status em atendimento. |
| Pós-condições | D1 persistida com status em_atendimento. |
| Nível | Sistema |

### TC79

| Campo | Conteúdo |
| --- | --- |
| ID | TC79 |
| HU | HU-05 Atualização de status |
| CA | CA-10 "O gestor deve conseguir atualizar status e observação da demanda." |
| Título | Exibir no histórico a observação registrada pelo gestor. |
| Pré-condições | M1, APP. D2 com status em_analise. Gestor demo logado. SUPOSIÇÃO: a observação aparece no item de histórico (L26). |
| Passos | 1. Gestor abre D2.<br>2. Seleciona o status "encaminhada".<br>3. Informa a observação "Enviado a SEOB.".<br>4. Salva.<br>5. Abrir o histórico de D2. |
| Resultado esperado | O histórico exibe um item com o texto "Enviado a SEOB.". |
| Pós-condições | D2 persistida como encaminhada, com o novo item de histórico. |
| Nível | Sistema |

### TC80

| Campo | Conteúdo |
| --- | --- |
| ID | TC80 |
| HU | HU-07 Painel do gestor |
| CA | CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente." |
| Título | Exibir no painel do gestor o total de demandas das métricas gerais. |
| Pré-condições | M1, APP. Gestor demo logado. Valor data.total de GET /metrics/summary com TOKEN_G = T. |
| Passos | 1. Abrir o painel do gestor. |
| Resultado esperado | O painel exibe o total T. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC81

| Campo | Conteúdo |
| --- | --- |
| ID | TC81 |
| HU | HU-07 Painel do gestor |
| CA | CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente." |
| Título | Exibir na fila recente a demanda criada por último. |
| Pré-condições | M1, APP. Demanda D7 criada por A imediatamente antes do teste. Gestor demo logado. SUPOSIÇÃO: a fila recente ordena por criadaEm decrescente (L15). |
| Passos | 1. Abrir o painel do gestor.<br>2. Localizar a seção de fila recente. |
| Resultado esperado | A fila recente exibe D7 como primeiro item. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC82

| Campo | Conteúdo |
| --- | --- |
| ID | TC82 |
| HU | HU-08 Revisão da triagem |
| CA | CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente." |
| Título | Exibir categoria, confiança e sugestão de encaminhamento na triagem. |
| Pré-condições | M1, APP. Demanda D8 com categoria, scoreTriagem e sugestaoEncaminhamento preenchidos (SUPOSIÇÃO: o fallback preenche o score, L04). Gestor demo logado. |
| Passos | 1. Abrir o painel do gestor.<br>2. Abrir a triagem de D8. |
| Resultado esperado | A tela exibe categoria, score e sugestão de encaminhamento iguais aos de GET /demands/{id de D8}. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC83

| Campo | Conteúdo |
| --- | --- |
| ID | TC83 |
| HU | HU-08 Revisão da triagem |
| CA | SUPOSIÇÃO |
| Título | Sugerir o órgão cujo categoriasJson contém a categoria da demanda. |
| Pré-condições | M1. TOKEN_A. GET /organs retorna um único órgão com vias_publicas em categoriasJson: "Secretaria de Obras". SUPOSIÇÃO: a sugestão sai de categoriasJson (L13). |
| Passos | 1. Enviar POST {API}/demands com categoria = vias_publicas e demais obrigatórios válidos. |
| Resultado esperado | data.sugestaoEncaminhamento = "Secretaria de Obras". |
| Pós-condições | Demanda persistida com a sugestão. |
| Nível | Integração de componentes |

### TC84

| Campo | Conteúdo |
| --- | --- |
| ID | TC84 |
| HU | HU-10 Dashboard do cidadão |
| CA | CA-08 "O dashboard do cidadão deve apresentar resumo das solicitações." |
| Título | Retornar ao cidadão métricas só das próprias demandas. |
| Pré-condições | M1. TOKEN_A. |
| Passos | 1. Enviar GET {API}/metrics/summary com TOKEN_A. |
| Resultado esperado | data.total = 3. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC85

| Campo | Conteúdo |
| --- | --- |
| ID | TC85 |
| HU | HU-07 Painel do gestor |
| CA | CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente." |
| Título | Retornar ao gestor métricas gerais. |
| Pré-condições | M1. TOKEN_G. Contagem total de demandas no banco = N (via Prisma). |
| Passos | 1. Enviar GET {API}/metrics/summary com TOKEN_G. |
| Resultado esperado | data.total = N. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Integração de componentes |

### TC86

| Campo | Conteúdo |
| --- | --- |
| ID | TC86 |
| HU | HU-07 Painel do gestor |
| CA | SUPOSIÇÃO |
| Título | Responder métricas sem Redis configurado. |
| Pré-condições | API iniciada com REDIS_URL vazio. M1. TOKEN_G. |
| Passos | 1. Enviar GET {API}/metrics/summary com TOKEN_G. |
| Resultado esperado | HTTP 200 com success: true. |
| Pós-condições | Nenhum dado alterado. API ativa. |
| Nível | Integração de componentes |

### TC87

| Campo | Conteúdo |
| --- | --- |
| ID | TC87 |
| HU | HU-07 Painel do gestor |
| CA | SUPOSIÇÃO |
| Título | Responder métricas com Redis configurado mas inacessível. |
| Pré-condições | API iniciada com REDIS_URL=redis://127.0.0.1:6399 (porta sem serviço). M1. TOKEN_G. Contagem total no banco = N. SUPOSIÇÃO: com Redis fora do ar, a API lê do banco (L14). |
| Passos | 1. Enviar GET {API}/metrics/summary com TOKEN_G. |
| Resultado esperado | HTTP 200 com data.total = N. |
| Pós-condições | API continua ativa (GET /health responde ok). |
| Nível | Integração de componentes |

### TC88

| Campo | Conteúdo |
| --- | --- |
| ID | TC88 |
| HU | HU-10 Dashboard do cidadão |
| CA | CA-08 "O dashboard do cidadão deve apresentar resumo das solicitações." |
| Título | Exibir no dashboard do cidadão o total das próprias solicitações. |
| Pré-condições | M1, APP. Cidadão A logado. SUPOSIÇÃO: o resumo usa GET /metrics/summary (L16). |
| Passos | 1. Abrir o dashboard do cidadão. |
| Resultado esperado | O dashboard exibe o total 3. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC89

| Campo | Conteúdo |
| --- | --- |
| ID | TC89 |
| HU | HU-02 Login |
| CA | CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." |
| Título | Navegar da home para a tela de login. |
| Pré-condições | M0, APP. Navegador sem sessão. |
| Passos | 1. Abrir a home.<br>2. Acionar o link ou botão de login. |
| Resultado esperado | O APP exibe a tela de login. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC90

| Campo | Conteúdo |
| --- | --- |
| ID | TC90 |
| HU | HU-01 Cadastro de conta |
| CA | CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." |
| Título | Navegar da home para a tela de cadastro. |
| Pré-condições | M0, APP. Navegador sem sessão. |
| Passos | 1. Abrir a home.<br>2. Acionar o link ou botão de cadastro. |
| Resultado esperado | O APP exibe a tela de cadastro. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC91

| Campo | Conteúdo |
| --- | --- |
| ID | TC91 |
| HU | HU-06 Visualizar e filtrar demandas |
| CA | CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." |
| Título | Navegar da home para a tela de demandas. |
| Pré-condições | M1, APP. Cidadão A logado (SUPOSIÇÃO: demandas exige sessão). |
| Passos | 1. Abrir a home.<br>2. Acionar o link ou botão de demandas. |
| Resultado esperado | O APP exibe a listagem de demandas. |
| Pós-condições | Nenhum dado alterado. |
| Nível | Sistema |

### TC92

| Campo | Conteúdo |
| --- | --- |
| ID | TC92 |
| HU | HU-03 Registro de demanda |
| CA | CA-12 "A interface deve ser utilizável em mobile, tablet e desktop." |
| Título | Registrar demanda em viewport mobile sem rolagem horizontal. |
| Pré-condições | M1, APP. Viewport 375×812. Cidadão A logado. SUPOSIÇÃO: "utilizável" = fluxo concluído com scrollWidth ≤ largura do viewport (L22). |
| Passos | 1. Executar os passos de TC41 no viewport 375×812.<br>2. Em cada tela, medir document.documentElement.scrollWidth. |
| Resultado esperado | O fluxo termina na tela de detalhe com scrollWidth ≤ 375 em todas as telas. |
| Pós-condições | Nova demanda de A persistida. |
| Nível | Sistema |

### TC93

| Campo | Conteúdo |
| --- | --- |
| ID | TC93 |
| HU | HU-03 Registro de demanda |
| CA | CA-12 "A interface deve ser utilizável em mobile, tablet e desktop." |
| Título | Registrar demanda em viewport tablet sem rolagem horizontal. |
| Pré-condições | Iguais às de TC92, com viewport 768×1024. |
| Passos | 1. Executar os passos de TC41 no viewport 768×1024.<br>2. Em cada tela, medir document.documentElement.scrollWidth. |
| Resultado esperado | O fluxo termina na tela de detalhe com scrollWidth ≤ 768 em todas as telas. |
| Pós-condições | Nova demanda de A persistida. |
| Nível | Sistema |

### TC94

| Campo | Conteúdo |
| --- | --- |
| ID | TC94 |
| HU | HU-03 Registro de demanda |
| CA | CA-12 "A interface deve ser utilizável em mobile, tablet e desktop." |
| Título | Registrar demanda em viewport desktop sem rolagem horizontal. |
| Pré-condições | Iguais às de TC92, com viewport 1440×900. |
| Passos | 1. Executar os passos de TC41 no viewport 1440×900.<br>2. Em cada tela, medir document.documentElement.scrollWidth. |
| Resultado esperado | O fluxo termina na tela de detalhe com scrollWidth ≤ 1440 em todas as telas. |
| Pós-condições | Nova demanda de A persistida. |
| Nível | Sistema |
