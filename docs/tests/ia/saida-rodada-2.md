# Saída da IA — Rodada 2

Saída íntegra, sem correção. Prompt enviado: [prompt-rodada-2.md](prompt-rodada-2.md).

---

Casos de teste do Urbanize: lacunas, alocação, derivação, casos e rastreabilidade

Usei só os quatro insumos. Não li código, seed nem banco. Toda informação que não está nos insumos aparece como SUPOSIÇÃO, com a lacuna correspondente (L-xx).

1. Lacunas e ambiguidades
ID	Tipo	Lacuna
L01	Divergência HU×contrato	HU-03 exige "foto, título, descrição, prioridade e localização". No contrato, imagemUrl é opcional (padrão vazio) e prioridade é opcional (padrão media). CA-04 fala em "permitir" upload, não em exigir. Não está definido se a foto é obrigatória na interface.
L02	Divergência CA×contrato	CA-04 exige "localização". O contrato só exige endereco.endereco com no mínimo 3 caracteres. Não está claro se latitude/longitude são obrigatórias nem se "localização" significa endereço em texto ou coordenada.
L03	Divergência CA×contrato	O "aceite de compartilhamento de dados" (CA-04) não existe no corpo de POST /demands. Não se sabe se o aceite fica registrado no backend ou se é só uma trava da interface.
L04	Regra sem valor	O formato de triagem "depende do servico de visao configurado". Não se sabe se, no fallback, tituloSugerido, descricaoSugerida e score vêm preenchidos.
L05	Transição não especificada	Não há máquina de estados. Faltam: status inicial na criação (presumido registrada), transições permitidas, possibilidade de voltar de resolvida/cancelada, PATCH para o mesmo status, e quem pode cancelar (o cidadão pode?).
L06	Regra sem valor	observacaoGestor no PATCH: não se sabe se é obrigatória nem qual o tamanho máximo.
L07	Código não declarado	Quando um cidadão acessa demanda de outra pessoa, não está definido se a resposta é 403 FORBIDDEN ou 404 DEMAND_NOT_FOUND.
L08	Permissão não declarada	"Gestor acessa demandas permitidas para o perfil" é vago. Não se sabe se um gestor com órgão pode ler ou alterar via PATCH uma demanda de outro órgão.
L09	Massa / modelo	Não há endpoint nem campo que ligue gestor a órgão ou demanda a órgão (o objeto de demanda não tem orgaoId). Também não se sabe se o gestor do seed tem órgão.
L10	Permissão (segurança)	POST /auth/register é público e aceita role: gestor, mas HU-01 fala só em cidadão. Qualquer pessoa pode se cadastrar como gestor, o que abre risco de escalada de privilégio. Precisa de decisão de produto.
L11	Regra sem valor	Faltam: tamanho máximo de todos os campos, formato de telefone, regra de "Email valido", se a unicidade do e-mail ignora maiúsculas/minúsculas, e política de senha (o mínimo é 1 caractere).
L12	HU sem contrato	HU-09 ("aceitar a sugestão de encaminhamento") não tem endpoint nem campo de órgão atribuído. Não dá para testar.
L13	Regra sem valor	O mapeamento categoria→órgão não está descrito, só categoriasJson. Não se sabe o que acontece com categoria sem órgão (ex.: outros) nem com duas ou mais órgãos na mesma categoria.
L14	Regra sem valor	Métricas: não há comportamento definido com Redis configurado mas fora do ar, nem fórmula para tempoMedioAtendimentoDias. Também não se sabe se porStatus lista status com zero nem qual a relação com METRICS_CRON.
L15	Critério impreciso	"Fila recente" (HU-07/CA-09): não há quantidade nem ordenação definidas.
L16	Critério impreciso	"Resumo das solicitações" (CA-08) e "métricas" (CA-09): o conteúdo exibido não está definido. Presumo GET /metrics/summary.
L17	Regra sem valor	Filtros: não se sabe se combinam com E ou OU, em quais campos busca procura, se diferencia maiúsculas/minúsculas, se bairro é igualdade ou parcial, nem a ordenação da lista.
L18	Regra sem valor	Protocolo: só há o exemplo URB-12345. Faltam regra de formato e de unicidade.
L19	Regra sem valor	Upload: faltam tipos aceitos, tamanho máximo, tratamento de categoria inválida e conversão de formato (o exemplo mostra .webp e .jpg).
L20	Divergência escopo×contrato	O contrato cobre só Vision não configurado. O escopo pede Vision que falha (credencial inválida, erro, timeout), caso não descrito. Também não se sabe o que acontece sem Vision e sem categoria enviada.
L21	Critério não testável como escrito	CA-11 "estados adequados": faltam textos e componentes esperados.
L22	Critério não testável como escrito	CA-12 "utilizável" é subjetivo e não tem breakpoints definidos.
L23	Critério não testável	CA-13 é critério de saída do processo, não comportamento do sistema. Não gera caso.
L24	Divergência de cliente	O contrato cita frontend Next (NEXT_PUBLIC_API_URL, FRONTEND_URL :4100). O Insumo 4 cita app Expo web. Não se sabe qual cliente está sob teste nem sua porta.
L25	Regra sem valor	Não se sabe se o token Bearer continua válido depois do logout (JWT sem estado).
L26	Regra sem valor	Faltam os campos de cada item de historico e se a criação já gera um item inicial (o exemplo mostra []).
L27	Permissão não declarada	Não se sabe se o cidadão pode chamar GET /organs. Também não está declarado se um gestor pode criar demanda (POST /demands só exige autenticação).
L28	Permissão não declarada	Não se sabe se o cidadão pode enviar origem = orgao/sistema_externo ou emailSolicitante diferente do seu.
L29	Regra sem valor	Destino depois do login e do cadastro, por perfil, não está definido (CA-02/CA-03).
L30	Divergência HU×contrato	HU-12 fala em "fotos" (plural). Upload e imagemUrl aceitam uma imagem só.
L31	Critério impreciso	CA-07 exige "localização", mas não diz quais campos exibir (endereço, bairro, cidade, coordenadas).

Não geram caso: HU-09 (L12), HU-11 e HU-13 (fora do escopo), CA-13 (L23), transições reversas e PATCH sem observação (L05, L06), categoria sem órgão (L13). Ficam bloqueados até decisão de produto.

2. Matriz de alocação
Condição de teste	Nível	Justificativa
Validação de campos de /auth/register (limites, enums, unicidade)	Integração de componentes	A regra fica na rota Express + Prisma. Supertest isola a regra da interface.
Login, credencial inválida, token inválido/expirado, cookie	Integração de componentes	Contrato HTTP e cabeçalhos Set-Cookie, verificáveis só na API.
Armazenar token e enviar Bearer no app	Componente	Regra de authService/session/api com HTTP mockado.
Criação de demanda: obrigatórios, limites, padrões, protocolo	Integração de componentes	Regra de negócio e persistência na API/banco.
Travas do formulário (localização, aceite) e preenchimento pela triagem	Componente + Sistema	Hook tem regra própria (Componente). A trava vista pelo usuário é fluxo de ponta a ponta (Sistema).
Upload: sucesso, NO_FILE, autenticação	Integração de componentes	Multer + rota, verificável por multipart via Supertest.
Fallback do Vision	Integração de componentes	Reação da API com Vision desligado ou falhando. Vision real está fora do escopo.
Visibilidade por perfil (listagem, detalhe)	Integração de componentes	Controle de acesso fica na API. A interface não é barreira de segurança.
Filtros da listagem	Integração de componentes + Sistema	A query string é regra da API. A aplicação do filtro na tela é fluxo do usuário.
Mudança de status, histórico, permissão do PATCH	Integração de componentes	Regra e persistência de estado.
Ciclo gestor altera status e cidadão vê	Sistema	Atravessa dois perfis, app, API e banco.
Métricas por perfil e com Redis indisponível	Integração de componentes	Depende de configuração do backend (REDIS_URL).
Sugestão de órgão por categoria	Integração de componentes	Regra interna determinística na API.
Painel do gestor, dashboard do cidadão, detalhe	Sistema	Exibição integrada de dados reais.
Estados de carregamento, erro e vazio	Componente (loading) + Sistema (vazio/erro)	Loading é transitório e testável de forma determinística no hook. Vazio e erro dependem de backend real ou parado.
Navegação a partir da home	Sistema	Rotas do app.
Responsividade (3 viewports)	Sistema	Playwright com viewport. A matriz de aparelhos fica fora do escopo.
3. Tabela de derivação
Regra	Técnica	Condições derivadas	Casos
R01 nome com mínimo de 2	Valor limite	1 caractere (inválido), 2 (válido)	TC06, TC07
R02 senha com mínimo de 1	Valor limite	0 (inválido), 1 (válido)	TC08, TC09
R03 email válido e único	Partição de equivalência	Válido e novo, formato inválido, já cadastrado	TC01, TC10, TC11
R04 role	Partição de equivalência	Omitido→cidadao, gestor, fora do enum	TC03, TC04, TC05
R05 Cookie de sessão	Partição de equivalência	Cadastro cria cookie, logout remove, cookie autentica	TC02, TC25, TC26
R06 Login	Tabela de decisão	E-mail existe × senha correta → sucesso por perfil / INVALID_CREDENTIALS. Corpo incompleto	TC13–TC17
R07 Autenticação de rotas protegidas	Partição de equivalência	Sem credencial, token adulterado, token expirado, cookie válido	TC22–TC25, TC40, TC48, TC73
R08 Obrigatórios de POST /demands	Valor limite	titulo 2/3, descricao 4/5, endereco.endereco 2/3	TC33, TC34, TC35, TC36
R09 categoria/prioridade	Partição de equivalência	Ausente, fora do enum, válida	TC37, TC38, TC39, TC28
R10 Padrões dos opcionais	Partição de equivalência	Opcionais omitidos	TC30, TC31, TC32
R11 Protocolo e status inicial	Partição de equivalência	Criação válida	TC28, TC29
R12 Envio do formulário (CA-04)	Tabela de decisão	Localização (S/N) × aceite (S/N) → envia só com S/S	TC41, TC42, TC43
R13 Triagem preenche o formulário	Partição de equivalência	Upload com sugestão	TC44
R14 Upload	Partição de equivalência	Com arquivo, sem arquivo, sem autenticação, foto vinculada	TC45–TC48
R15 Fallback do Vision	Tabela de decisão	Vision configurado (S/N) × funciona (S/N) × categoria enviada → categoria final	TC49, TC50, TC51
R16 Visibilidade da listagem	Tabela de decisão	Perfil × vínculo com órgão → próprias / do órgão / fila geral	TC52, TC53, TC54
R17 Filtros	Partição de equivalência	Cada parâmetro válido, combinação, enum inválido	TC55–TC62
R18 Acesso ao detalhe	Tabela de decisão	Dono × existe → 200 / recusa / 404	TC66, TC67, TC68, TC69
R19 Permissão do PATCH	Partição de equivalência	Gestor, cidadão, sem autenticação, id inexistente, status inválido	TC70, TC72–TC75
R20 Ciclo de status	Transição de estados	registrada→em_analise→encaminhada→em_atendimento→resolvida, registrada→cancelada, cada transição gera histórico	TC71, TC76, TC77, TC78, TC79
R21 Métricas	Partição de equivalência	Cidadão, gestor, Redis ausente, Redis inacessível	TC84–TC87
R22 Sugestão de órgão	Tabela de decisão	Categoria com órgão mapeado → nome do órgão	TC83
R23 Estados de interface	Partição de equivalência	Carregando, vazio, erro	TC63, TC64, TC65
R24 Telas agregadoras	Partição de equivalência	Painel (métricas, fila, triagem), dashboard	TC80, TC81, TC82, TC88
R25 Navegação e responsividade	Partição de equivalência	3 destinos a partir da home, 3 viewports	TC89–TC94
R26 Sessão no app	Partição de equivalência	Login guarda token, requisição leva Bearer	TC20, TC21
R27 Rota inexistente	Partição de equivalência	Caminho desconhecido	TC27
R28 Cadastro e login pela interface	Partição de equivalência	Cidadão, gestor	TC12, TC18, TC19
4. Casos de teste
Massas de dados usadas nas pré-condições
{API} = http://127.0.0.1:4000/api.
M0: API ativa em {API}. Banco migrado e seed executado (cidadao@urbanize.com/demo, gestor@urbanize.com/demo).
M1: M0 mais os cidadãos A (cidadaoa@teste.com/demo) e B (cidadaob@teste.com/demo), criados via POST /auth/register, e as demandas abaixo. Os status foram ajustados via PATCH pelo gestor.
D1 (de A): registrada, vias_publicas, alta, bairro "Boa Vista", título "Buraco na rua"
D2 (de A): em_analise, coleta_de_lixo, media, bairro "Casa Forte", título "Lixo acumulado"
D3 (de A): resolvida, iluminacao_publica, baixa, bairro "Boa Vista", título "Poste apagado"
D4 (de B): registrada, vias_publicas, media, bairro "Boa Vista", título "Calcada quebrada"
TOKEN_A, TOKEN_B, TOKEN_G: tokens obtidos via POST /auth/login para A, B e gestor demo.
APP: cliente web (Expo web, ver L24) rodando e apontando para {API}.

O nível de teste aparece no título de cada caso, fora dos 8 campos, para respeitar o "não acrescente outros campos".

TC01 · Nível: Integração de componentes
ID: TC01
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Cadastrar usuário com dados válidos.
Pré-condições: M0. E-mail novo01@teste.com inexistente no banco.
Passos: 1. Enviar POST {API}/auth/register com {"nome":"Maria Silva","email":"novo01@teste.com","senha":"demo","telefone":"(81) 99999-9999","role":"cidadao"}.
Resultado esperado: HTTP 201 com success: true e data.user.email = novo01@teste.com.
Pós-condições: Usuário novo01@teste.com persistido no banco.
TC02 · Nível: Integração de componentes
ID: TC02
HU: HU-01 Cadastro de conta
CA: SUPOSIÇÃO
Título: Verificar que o cadastro cria o cookie de sessão HTTP-only.
Pré-condições: M0. E-mail novo02@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com nome, e-mail novo02@teste.com e senha válidos. 2. Ler o cabeçalho Set-Cookie da resposta.
Resultado esperado: Set-Cookie contém urbanize_session com o atributo HttpOnly.
Pós-condições: Usuário persistido. Sessão emitida.
TC03 · Nível: Integração de componentes
ID: TC03
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Atribuir o perfil cidadao quando role é omitido.
Pré-condições: M0. E-mail novo03@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com nome, email, senha válidos e sem role.
Resultado esperado: data.user.role = cidadao.
Pós-condições: Usuário persistido com perfil cidadao.
TC04 · Nível: Integração de componentes
ID: TC04
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Cadastrar usuário com perfil gestor.
Pré-condições: M0. E-mail novo04@teste.com inexistente. Ver L10.
Passos: 1. Enviar POST {API}/auth/register com dados válidos e "role":"gestor".
Resultado esperado: HTTP 201 com data.user.role = gestor.
Pós-condições: Usuário persistido com perfil gestor.
TC05 · Nível: Integração de componentes
ID: TC05
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Recusar cadastro com role fora do enum.
Pré-condições: M0. E-mail novo05@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com dados válidos e "role":"admin".
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum usuário novo05@teste.com criado.
TC06 · Nível: Integração de componentes
ID: TC06
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Recusar cadastro com nome de 1 caractere.
Pré-condições: M0. E-mail novo06@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com "nome":"M" e demais campos válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum usuário novo06@teste.com criado.
TC07 · Nível: Integração de componentes
ID: TC07
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Aceitar cadastro com nome de 2 caracteres.
Pré-condições: M0. E-mail novo07@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com "nome":"Ma" e demais campos válidos.
Resultado esperado: HTTP 201 com data.user.nome = Ma.
Pós-condições: Usuário persistido.
TC08 · Nível: Integração de componentes
ID: TC08
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Recusar cadastro com senha vazia.
Pré-condições: M0. E-mail novo08@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com "senha":"" e demais campos válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum usuário novo08@teste.com criado.
TC09 · Nível: Integração de componentes
ID: TC09
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Aceitar cadastro com senha de 1 caractere.
Pré-condições: M0. E-mail novo09@teste.com inexistente.
Passos: 1. Enviar POST {API}/auth/register com "senha":"a" e demais campos válidos.
Resultado esperado: HTTP 201 com success: true.
Pós-condições: Usuário persistido.
TC10 · Nível: Integração de componentes
ID: TC10
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Recusar cadastro com e-mail em formato inválido.
Pré-condições: M0.
Passos: 1. Enviar POST {API}/auth/register com "email":"maria.teste.com" e demais campos válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum usuário criado.
TC11 · Nível: Integração de componentes
ID: TC11
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Recusar cadastro com e-mail já cadastrado.
Pré-condições: M0. Usuário cidadao@urbanize.com existente.
Passos: 1. Enviar POST {API}/auth/register com "email":"cidadao@urbanize.com" e demais campos válidos.
Resultado esperado: HTTP 409 com error.code = EMAIL_ALREADY_EXISTS.
Pós-condições: Continua existindo um único usuário com esse e-mail, sem alteração.
TC12 · Nível: Sistema
ID: TC12
HU: HU-01 Cadastro de conta
CA: CA-03 "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."
Título: Criar conta de cidadão pela tela de cadastro.
Pré-condições: M0, APP. E-mail novo12@teste.com inexistente. Navegador sem sessão.
Passos: 1. Abrir a tela de cadastro no APP. 2. Informar nome "Maria Silva", e-mail novo12@teste.com, senha "demo" e perfil cidadão. 3. Enviar o formulário. 4. Enviar POST {API}/auth/login com novo12@teste.com/demo.
Resultado esperado: O login do passo 4 retorna HTTP 200 com data.user.role = cidadao.
Pós-condições: Usuário novo12@teste.com persistido.
TC13 · Nível: Integração de componentes
ID: TC13
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Autenticar usuário com perfil cidadão.
Pré-condições: M0.
Passos: 1. Enviar POST {API}/auth/login com {"email":"cidadao@urbanize.com","senha":"demo"}.
Resultado esperado: HTTP 200 com data.user.role = cidadao e data.token não vazio.
Pós-condições: Sessão emitida. Nenhum dado alterado.
TC14 · Nível: Integração de componentes
ID: TC14
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Autenticar usuário com perfil gestor.
Pré-condições: M0.
Passos: 1. Enviar POST {API}/auth/login com {"email":"gestor@urbanize.com","senha":"demo"}.
Resultado esperado: HTTP 200 com data.user.role = gestor e data.token não vazio.
Pós-condições: Sessão emitida. Nenhum dado alterado.
TC15 · Nível: Integração de componentes
ID: TC15
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Recusar login com senha incorreta.
Pré-condições: M0.
Passos: 1. Enviar POST {API}/auth/login com {"email":"cidadao@urbanize.com","senha":"errada"}.
Resultado esperado: HTTP 401 com error.code = INVALID_CREDENTIALS.
Pós-condições: Nenhum cookie de sessão emitido.
TC16 · Nível: Integração de componentes
ID: TC16
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Recusar login com e-mail não cadastrado.
Pré-condições: M0. E-mail inexistente@teste.com não cadastrado.
Passos: 1. Enviar POST {API}/auth/login com {"email":"inexistente@teste.com","senha":"demo"}.
Resultado esperado: HTTP 401 com error.code = INVALID_CREDENTIALS.
Pós-condições: Nenhum cookie de sessão emitido.
TC17 · Nível: Integração de componentes
ID: TC17
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Recusar login sem o campo email.
Pré-condições: M0. SUPOSIÇÃO: os campos do login são obrigatórios (não declarado).
Passos: 1. Enviar POST {API}/auth/login com {"senha":"demo"}.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum cookie de sessão emitido.
TC18 · Nível: Sistema
ID: TC18
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Entrar pela tela de login com perfil cidadão.
Pré-condições: M0, APP. Navegador sem sessão. SUPOSIÇÃO: o destino depois do login do cidadão é o dashboard do cidadão (L29).
Passos: 1. Abrir a tela de login. 2. Informar cidadao@urbanize.com/demo. 3. Enviar.
Resultado esperado: O APP exibe o dashboard do cidadão.
Pós-condições: Sessão de cidadão ativa no navegador.
TC19 · Nível: Sistema
ID: TC19
HU: HU-02 Login
CA: CA-02 "O login deve permitir entrada com perfis de cidadão e gestor."
Título: Entrar pela tela de login com perfil gestor.
Pré-condições: M0, APP. Navegador sem sessão. SUPOSIÇÃO: o destino depois do login do gestor é o painel do gestor (L29).
Passos: 1. Abrir a tela de login. 2. Informar gestor@urbanize.com/demo. 3. Enviar.
Resultado esperado: O APP exibe o painel do gestor.
Pós-condições: Sessão de gestor ativa no navegador.
TC20 · Nível: Componente
ID: TC20
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Guardar na sessão o token retornado pelo login.
Pré-condições: HTTP mockado: POST /auth/login responde 200 com data.token = jwt-teste. Sessão vazia. SUPOSIÇÃO: authService persiste o token em session.
Passos: 1. Chamar authService.login("cidadao@urbanize.com","demo"). 2. Ler o token de session.
Resultado esperado: O token lido é jwt-teste.
Pós-condições: session contém o token jwt-teste.
TC21 · Nível: Componente
ID: TC21
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Enviar o token da sessão no cabeçalho Authorization das requisições.
Pré-condições: session contém o token jwt-teste. HTTP mockado para GET /demands. SUPOSIÇÃO: o app usa Bearer e não só cookie.
Passos: 1. Chamar o método de listagem de demandas do serviço api. 2. Capturar a requisição no mock.
Resultado esperado: A requisição contém Authorization: Bearer jwt-teste.
Pós-condições: session inalterada.
TC22 · Nível: Integração de componentes
ID: TC22
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Recusar acesso a rota protegida sem credencial.
Pré-condições: M0.
Passos: 1. Enviar GET {API}/auth/me sem cookie e sem Authorization.
Resultado esperado: HTTP 401 com error.code = UNAUTHENTICATED.
Pós-condições: Nenhum dado alterado.
TC23 · Nível: Integração de componentes
ID: TC23
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Recusar acesso com token adulterado.
Pré-condições: M0. TOKEN_A com o último caractere da assinatura alterado.
Passos: 1. Enviar GET {API}/auth/me com Authorization: Bearer <token adulterado>.
Resultado esperado: HTTP 401 com error.code = INVALID_TOKEN.
Pós-condições: Nenhum dado alterado.
TC24 · Nível: Integração de componentes
ID: TC24
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Recusar acesso com token expirado.
Pré-condições: API iniciada com JWT_EXPIRES_IN=1s. Token do cidadão demo obtido via login. Aguardar 2 segundos.
Passos: 1. Enviar GET {API}/auth/me com o token expirado.
Resultado esperado: HTTP 401 com error.code = INVALID_TOKEN.
Pós-condições: Nenhum dado alterado. Restaurar JWT_EXPIRES_IN padrão.
TC25 · Nível: Integração de componentes
ID: TC25
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Autenticar requisição usando só o cookie de sessão.
Pré-condições: M0. Cookie urbanize_session obtido via login do cidadão demo.
Passos: 1. Enviar GET {API}/auth/me só com o cookie, sem Authorization.
Resultado esperado: HTTP 200 com data.user.email = cidadao@urbanize.com.
Pós-condições: Nenhum dado alterado.
TC26 · Nível: Integração de componentes
ID: TC26
HU: HU-02 Login
CA: SUPOSIÇÃO
Título: Remover o cookie de sessão no logout.
Pré-condições: M0. Cookie urbanize_session válido.
Passos: 1. Enviar POST {API}/auth/logout com o cookie. 2. Ler o cabeçalho Set-Cookie.
Resultado esperado: Set-Cookie limpa urbanize_session (valor vazio ou expiração no passado).
Pós-condições: Navegador ou cliente sem cookie de sessão válido.
TC27 · Nível: Integração de componentes
ID: TC27
HU: SUPOSIÇÃO (nenhuma HU. Regra do contrato de API)
CA: SUPOSIÇÃO
Título: Retornar erro padronizado para rota inexistente.
Pré-condições: M0.
Passos: 1. Enviar GET {API}/rota-inexistente com TOKEN_A.
Resultado esperado: HTTP 404 com error.code = NOT_FOUND.
Pós-condições: Nenhum dado alterado.
TC28 · Nível: Integração de componentes
ID: TC28
HU: HU-03 Registro de demanda
CA: CA-05 "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe."
Título: Gerar protocolo ao criar demanda válida.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/demands com o corpo de exemplo do contrato (titulo "Buraco na rua", descricao "Buraco grande causando risco para motos.", categoria vias_publicas, prioridade alta, endereco.endereco "Rua Exemplo, 100").
Resultado esperado: HTTP 201 com data.protocolo não vazio.
Pós-condições: Demanda persistida e vinculada ao cidadão A.
TC29 · Nível: Integração de componentes
ID: TC29
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Criar a demanda com status inicial registrada.
Pré-condições: M1. TOKEN_A. SUPOSIÇÃO: o status inicial é registrada (L05).
Passos: 1. Enviar POST {API}/demands com os campos obrigatórios válidos.
Resultado esperado: data.status = registrada.
Pós-condições: Demanda persistida com status registrada.
TC30 · Nível: Integração de componentes
ID: TC30
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Aplicar prioridade padrão media quando prioridade é omitida.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/demands só com titulo, descricao, categoria e endereco.endereco válidos.
Resultado esperado: data.prioridade = media.
Pós-condições: Demanda persistida com prioridade media.
TC31 · Nível: Integração de componentes
ID: TC31
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Aplicar bairro e cidade padrão quando omitidos.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/demands com endereco contendo só endereco = "Rua Exemplo, 100" e demais obrigatórios válidos.
Resultado esperado: data.endereco retorna bairro = Nao informado e cidade = Recife.
Pós-condições: Demanda persistida com os valores padrão de endereço.
TC32 · Nível: Integração de componentes
ID: TC32
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Preencher o solicitante com os dados do usuário autenticado.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/demands sem nomeSolicitante e sem emailSolicitante, com os obrigatórios válidos.
Resultado esperado: data.emailSolicitante = cidadaoa@teste.com e data.nomeSolicitante = nome cadastrado de A.
Pós-condições: Demanda persistida com os dados do solicitante de A.
TC33 · Nível: Integração de componentes
ID: TC33
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar demanda com titulo de 2 caracteres.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com "titulo":"Bu" e demais obrigatórios válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC34 · Nível: Integração de componentes
ID: TC34
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Aceitar demanda com todos os obrigatórios no tamanho mínimo.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/demands com "titulo":"Bur", "descricao":"Grand", "categoria":"vias_publicas", "endereco":{"endereco":"R 1"}.
Resultado esperado: HTTP 201 com success: true.
Pós-condições: Demanda persistida.
TC35 · Nível: Integração de componentes
ID: TC35
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar demanda com descricao de 4 caracteres.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com "descricao":"Gran" e demais obrigatórios válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC36 · Nível: Integração de componentes
ID: TC36
HU: HU-03 Registro de demanda
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Recusar demanda com endereco.endereco de 2 caracteres.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com "endereco":{"endereco":"R1"} e demais obrigatórios válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC37 · Nível: Integração de componentes
ID: TC37
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar demanda sem categoria.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com os demais obrigatórios válidos e sem categoria.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC38 · Nível: Integração de componentes
ID: TC38
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar demanda com categoria fora do enum.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com "categoria":"transito" e demais obrigatórios válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC39 · Nível: Integração de componentes
ID: TC39
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar demanda com prioridade fora do enum.
Pré-condições: M1. TOKEN_A. Contagem de demandas de A = 3.
Passos: 1. Enviar POST {API}/demands com "prioridade":"urgente" e demais obrigatórios válidos.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Contagem de demandas de A continua 3.
TC40 · Nível: Integração de componentes
ID: TC40
HU: HU-03 Registro de demanda
CA: SUPOSIÇÃO
Título: Recusar criação de demanda sem autenticação.
Pré-condições: M1. Contagem total de demandas = N.
Passos: 1. Enviar POST {API}/demands com corpo válido, sem cookie e sem Authorization.
Resultado esperado: HTTP 401 com error.code = UNAUTHENTICATED.
Pós-condições: Contagem total de demandas continua N.
TC41 · Nível: Sistema
ID: TC41
HU: HU-03 Registro de demanda
CA: CA-05 "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe."
Título: Abrir a tela de detalhe com o protocolo depois de registrar a demanda.
Pré-condições: M1, APP. Cidadão A logado no APP.
Passos: 1. Abrir o formulário de nova demanda. 2. Informar título "Buraco na rua", descrição "Buraco grande causando risco para motos.", categoria vias públicas, prioridade alta e localização "Rua Exemplo, 100". 3. Marcar o aceite de compartilhamento de dados. 4. Enviar.
Resultado esperado: O APP exibe a tela de detalhe com o mesmo protocolo retornado por POST /demands.
Pós-condições: Nova demanda de A persistida.
TC42 · Nível: Sistema
ID: TC42
HU: HU-03 Registro de demanda
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Impedir o envio da demanda sem localização.
Pré-condições: M1, APP. Cidadão A logado. Monitoramento de rede ativo no Playwright.
Passos: 1. Abrir o formulário de nova demanda. 2. Preencher título, descrição e categoria válidos. 3. Deixar a localização vazia. 4. Marcar o aceite. 5. Acionar o envio.
Resultado esperado: Nenhuma requisição POST /demands é disparada.
Pós-condições: Contagem de demandas de A inalterada. Formulário continua aberto com os dados preenchidos.
TC43 · Nível: Sistema
ID: TC43
HU: HU-03 Registro de demanda
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Impedir o envio da demanda sem aceite de compartilhamento de dados.
Pré-condições: M1, APP. Cidadão A logado. Monitoramento de rede ativo.
Passos: 1. Abrir o formulário de nova demanda. 2. Preencher título, descrição, categoria e localização válidos. 3. Não marcar o aceite. 4. Acionar o envio.
Resultado esperado: Nenhuma requisição POST /demands é disparada.
Pós-condições: Contagem de demandas de A inalterada. Formulário continua aberto.
TC44 · Nível: Componente
ID: TC44
HU: HU-03 Registro de demanda
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Preencher título e descrição com a sugestão da triagem depois do upload.
Pré-condições: HTTP mockado: POST /upload/image responde 200 com triagem.tituloSugerido = "Buraco na rua" e triagem.descricaoSugerida = "Imagem analisada automaticamente.". Hook do formulário com título e descrição vazios.
Passos: 1. Acionar a função de upload do hook com um arquivo foto.jpg. 2. Aguardar a resolução da promessa. 3. Ler o estado de título e descrição.
Resultado esperado: Título = "Buraco na rua" e descrição = "Imagem analisada automaticamente.".
Pós-condições: Estado do formulário com imagemUrl do mock guardado.
TC45 · Nível: Sistema
ID: TC45
HU: HU-12 Anexar fotos
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Vincular à demanda criada a foto anexada no formulário.
Pré-condições: M1, APP. Cidadão A logado. Arquivo foto.jpg disponível. GOOGLE_VISION_CREDENTIALS vazio.
Passos: 1. Abrir o formulário de nova demanda. 2. Anexar foto.jpg. 3. Preencher os campos obrigatórios, a localização e o aceite. 4. Enviar. 5. Enviar GET {API}/demands/:id da demanda criada com TOKEN_A.
Resultado esperado: data.imagemUrl da demanda é não vazio e começa com /uploads/.
Pós-condições: Demanda e arquivo de imagem persistidos.
TC46 · Nível: Integração de componentes
ID: TC46
HU: HU-12 Anexar fotos
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Receber a URL da imagem ao enviar arquivo válido.
Pré-condições: M1. TOKEN_A. Arquivo foto.jpg válido.
Passos: 1. Enviar POST {API}/upload/image (multipart) com imagem=@foto.jpg e categoria=vias_publicas.
Resultado esperado: HTTP 200 com data.imageUrl começando com /uploads/.
Pós-condições: Arquivo gravado no armazenamento de uploads.
TC47 · Nível: Integração de componentes
ID: TC47
HU: HU-12 Anexar fotos
CA: SUPOSIÇÃO
Título: Recusar upload sem arquivo.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar POST {API}/upload/image (multipart) só com categoria=vias_publicas.
Resultado esperado: HTTP 400 com error.code = NO_FILE.
Pós-condições: Nenhum arquivo gravado.
TC48 · Nível: Integração de componentes
ID: TC48
HU: HU-12 Anexar fotos
CA: SUPOSIÇÃO
Título: Recusar upload sem autenticação.
Pré-condições: M1. Arquivo foto.jpg.
Passos: 1. Enviar POST {API}/upload/image com imagem=@foto.jpg, sem cookie e sem Authorization.
Resultado esperado: HTTP 401 com error.code = UNAUTHENTICATED.
Pós-condições: Nenhum arquivo gravado.
TC49 · Nível: Integração de componentes
ID: TC49
HU: HU-08 Revisão da triagem
CA: SUPOSIÇÃO
Título: Usar a categoria enviada pelo frontend quando o Google Vision não está configurado.
Pré-condições: API iniciada com GOOGLE_VISION_CREDENTIALS vazio. M1. TOKEN_A. Arquivo foto.jpg.
Passos: 1. Enviar POST {API}/upload/image com imagem=@foto.jpg e categoria=zeladoria.
Resultado esperado: data.triagem.categoria = zeladoria.
Pós-condições: Arquivo gravado. Nenhuma chamada ao Google Vision.
TC50 · Nível: Integração de componentes
ID: TC50
HU: HU-08 Revisão da triagem
CA: SUPOSIÇÃO
Título: Usar a categoria enviada quando o Google Vision configurado falha.
Pré-condições: API iniciada com GOOGLE_VISION_CREDENTIALS contendo credencial inválida. M1. TOKEN_A. SUPOSIÇÃO: falha do Vision segue o mesmo fallback do "não configurado" (L20).
Passos: 1. Enviar POST {API}/upload/image com imagem=@foto.jpg e categoria=saneamento.
Resultado esperado: HTTP 200 com data.triagem.categoria = saneamento.
Pós-condições: Arquivo gravado. API continua ativa (GET /health responde ok).
TC51 · Nível: Sistema
ID: TC51
HU: HU-03 Registro de demanda
CA: CA-04 "O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados."
Título: Registrar demanda com a categoria escolhida manualmente quando o Vision está indisponível.
Pré-condições: API com GOOGLE_VISION_CREDENTIALS vazio. M1, APP. Cidadão A logado.
Passos: 1. Abrir o formulário de nova demanda. 2. Selecionar a categoria zeladoria. 3. Anexar foto.jpg. 4. Preencher título, descrição, localização e aceite. 5. Enviar. 6. Enviar GET {API}/demands/:id da demanda criada com TOKEN_A.
Resultado esperado: data.categoria = zeladoria.
Pós-condições: Demanda persistida com a categoria zeladoria.
TC52 · Nível: Integração de componentes
ID: TC52
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Listar para o cidadão só as próprias demandas.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands com TOKEN_A.
Resultado esperado: data contém exatamente D1, D2 e D3 (sem D4).
Pós-condições: Nenhum dado alterado.
TC53 · Nível: Integração de componentes
ID: TC53
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Listar a fila geral para gestor sem vínculo com órgão.
Pré-condições: M1. TOKEN_G. SUPOSIÇÃO: gestor@urbanize.com do seed não tem órgão (L09).
Passos: 1. Enviar GET {API}/demands com TOKEN_G.
Resultado esperado: data contém D1, D2, D3 e D4.
Pós-condições: Nenhum dado alterado.
TC54 · Nível: Integração de componentes
ID: TC54
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Listar para gestor vinculado só as demandas do seu órgão.
Pré-condições: M1. Gestor G2 vinculado ao órgão "Secretaria de Obras" direto no banco. D1 vinculada a esse órgão e D2 a outro. Token de G2. SUPOSIÇÃO: forma do vínculo gestor↔órgão e demanda↔órgão (L09).
Passos: 1. Enviar GET {API}/demands com o token de G2.
Resultado esperado: data contém D1 e não contém D2.
Pós-condições: Nenhum dado alterado.
TC55 · Nível: Integração de componentes
ID: TC55
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Filtrar demandas por status.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands?status=em_analise com TOKEN_A.
Resultado esperado: data contém só D2.
Pós-condições: Nenhum dado alterado.
TC56 · Nível: Integração de componentes
ID: TC56
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Filtrar demandas por categoria.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands?categoria=vias_publicas com TOKEN_A.
Resultado esperado: data contém só D1.
Pós-condições: Nenhum dado alterado.
TC57 · Nível: Integração de componentes
ID: TC57
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Filtrar demandas por prioridade.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands?prioridade=baixa com TOKEN_A.
Resultado esperado: data contém só D3.
Pós-condições: Nenhum dado alterado.
TC58 · Nível: Integração de componentes
ID: TC58
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Filtrar demandas por bairro.
Pré-condições: M1. TOKEN_A. SUPOSIÇÃO: bairro compara igualdade exata (L17).
Passos: 1. Enviar GET {API}/demands?bairro=Boa%20Vista com TOKEN_A.
Resultado esperado: data contém só D1 e D3.
Pós-condições: Nenhum dado alterado.
TC59 · Nível: Integração de componentes
ID: TC59
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Filtrar demandas por texto em busca.
Pré-condições: M1. TOKEN_A. SUPOSIÇÃO: busca procura no título (L17).
Passos: 1. Enviar GET {API}/demands?busca=Poste com TOKEN_A.
Resultado esperado: data contém só D3.
Pós-condições: Nenhum dado alterado.
TC60 · Nível: Integração de componentes
ID: TC60
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Combinar filtros status e categoria.
Pré-condições: M1. TOKEN_G (fila geral). SUPOSIÇÃO: filtros combinam com E (L17).
Passos: 1. Enviar GET {API}/demands?status=registrada&categoria=vias_publicas com TOKEN_G.
Resultado esperado: data contém D1 e D4 e nenhuma demanda com status diferente de registrada ou categoria diferente de vias_publicas.
Pós-condições: Nenhum dado alterado.
TC61 · Nível: Integração de componentes
ID: TC61
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Recusar filtro com status fora do enum.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands?status=aberta com TOKEN_A.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: Nenhum dado alterado.
TC62 · Nível: Sistema
ID: TC62
HU: HU-06 Visualizar e filtrar demandas
CA: CA-06 "A listagem deve exibir demandas e aplicar filtros corretamente."
Título: Aplicar filtro de status na tela de listagem.
Pré-condições: M1, APP. Cidadão A logado.
Passos: 1. Abrir a listagem de demandas. 2. Selecionar o filtro de status "em análise". 3. Aplicar.
Resultado esperado: A lista exibe só a demanda D2.
Pós-condições: Nenhum dado alterado.
TC63 · Nível: Sistema
ID: TC63
HU: HU-06 Visualizar e filtrar demandas
CA: CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio."
Título: Exibir estado vazio na listagem de cidadão sem demandas.
Pré-condições: M0, APP. Cidadão C (cidadaoc@teste.com) recém-cadastrado, sem demandas, logado.
Passos: 1. Abrir a listagem de demandas.
Resultado esperado: O APP exibe indicação de lista vazia no lugar de itens.
Pós-condições: Nenhum dado alterado.
TC64 · Nível: Sistema
ID: TC64
HU: HU-06 Visualizar e filtrar demandas
CA: CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio."
Título: Exibir estado de erro na listagem quando a API está indisponível.
Pré-condições: M1, APP. Cidadão A logado. Processo da API encerrado.
Passos: 1. Abrir a listagem de demandas.
Resultado esperado: O APP exibe indicação de erro no lugar da lista.
Pós-condições: Nenhum dado alterado. Reiniciar a API.
TC65 · Nível: Componente
ID: TC65
HU: HU-06 Visualizar e filtrar demandas
CA: CA-11 "O sistema deve exibir estados adequados de carregamento, erro e vazio."
Título: Expor estado de carregamento enquanto a listagem está pendente.
Pré-condições: HTTP mockado: GET /demands com promessa não resolvida.
Passos: 1. Montar o hook de listagem de demandas. 2. Ler o estado de carregamento antes de resolver o mock.
Resultado esperado: Estado de carregamento = verdadeiro.
Pós-condições: Resolver o mock. O hook sai do estado de carregamento.
TC66 · Nível: Integração de componentes
ID: TC66
HU: HU-04 Acompanhar status e histórico
CA: CA-07 "A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico."
Título: Consultar detalhe de demanda própria.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/demands/{id de D1} com TOKEN_A.
Resultado esperado: HTTP 200 com data.protocolo igual ao protocolo de D1.
Pós-condições: Nenhum dado alterado.
TC67 · Nível: Integração de componentes
ID: TC67
HU: HU-04 Acompanhar status e histórico
CA: SUPOSIÇÃO
Título: Recusar ao cidadão o detalhe de demanda de outra pessoa.
Pré-condições: M1. TOKEN_A. Código HTTP esperado indefinido (L07).
Passos: 1. Enviar GET {API}/demands/{id de D4} com TOKEN_A.
Resultado esperado: Resposta com success: false e sem os dados de D4.
Pós-condições: Nenhum dado alterado.
TC68 · Nível: Integração de componentes
ID: TC68
HU: HU-04 Acompanhar status e histórico
CA: SUPOSIÇÃO
Título: Retornar erro para demanda inexistente.
Pré-condições: M1. TOKEN_A. ID inexistente123 não cadastrado.
Passos: 1. Enviar GET {API}/demands/inexistente123 com TOKEN_A.
Resultado esperado: HTTP 404 com error.code = DEMAND_NOT_FOUND.
Pós-condições: Nenhum dado alterado.
TC69 · Nível: Sistema
ID: TC69
HU: HU-04 Acompanhar status e histórico
CA: CA-07 "A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico."
Título: Exibir no detalhe os seis dados exigidos da demanda.
Pré-condições: M1, APP. Cidadão A logado. D2 com pelo menos 1 item de histórico.
Passos: 1. Abrir a listagem. 2. Abrir o detalhe de D2.
Resultado esperado: A tela exibe protocolo, descrição, localização, prioridade, status e histórico de D2, iguais a GET /demands/{id de D2}.
Pós-condições: Nenhum dado alterado.
TC70 · Nível: Integração de componentes
ID: TC70
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Atualizar o status da demanda como gestor.
Pré-condições: M1. TOKEN_G. D1 com status registrada.
Passos: 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"em_atendimento","observacaoGestor":"Equipe acionada para vistoria."} e TOKEN_G.
Resultado esperado: HTTP 200 com data.status = em_atendimento.
Pós-condições: D1 persistida com status em_atendimento.
TC71 · Nível: Integração de componentes
ID: TC71
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Acrescentar item ao histórico ao atualizar o status.
Pré-condições: M1. TOKEN_G. D2 com historico de tamanho H (lido via GET).
Passos: 1. Enviar PATCH {API}/demands/{id de D2}/status com {"status":"encaminhada","observacaoGestor":"Enviado a SEOB."} e TOKEN_G.
Resultado esperado: data.historico tem tamanho H+1.
Pós-condições: Histórico de D2 persistido com o novo item.
TC72 · Nível: Integração de componentes
ID: TC72
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Recusar atualização de status feita por cidadão.
Pré-condições: M1. TOKEN_A. D1 com status registrada.
Passos: 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"resolvida"} e TOKEN_A.
Resultado esperado: HTTP 403 com error.code = FORBIDDEN.
Pós-condições: D1 continua registrada, com histórico inalterado.
TC73 · Nível: Integração de componentes
ID: TC73
HU: HU-05 Atualização de status
CA: SUPOSIÇÃO
Título: Recusar atualização de status sem autenticação.
Pré-condições: M1. D1 com status registrada.
Passos: 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"resolvida"}, sem cookie e sem Authorization.
Resultado esperado: HTTP 401 com error.code = UNAUTHENTICATED.
Pós-condições: D1 continua registrada.
TC74 · Nível: Integração de componentes
ID: TC74
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Recusar atualização com status fora do enum.
Pré-condições: M1. TOKEN_G. D1 com status registrada.
Passos: 1. Enviar PATCH {API}/demands/{id de D1}/status com {"status":"finalizada"} e TOKEN_G.
Resultado esperado: HTTP 422 com error.code = VALIDATION_ERROR.
Pós-condições: D1 continua registrada, com histórico inalterado.
TC75 · Nível: Integração de componentes
ID: TC75
HU: HU-05 Atualização de status
CA: SUPOSIÇÃO
Título: Recusar atualização de status de demanda inexistente.
Pré-condições: M1. TOKEN_G. ID inexistente123 não cadastrado.
Passos: 1. Enviar PATCH {API}/demands/inexistente123/status com {"status":"em_analise"} e TOKEN_G.
Resultado esperado: HTTP 404 com error.code = DEMAND_NOT_FOUND.
Pós-condições: Nenhuma demanda criada ou alterada.
TC76 · Nível: Integração de componentes
ID: TC76
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Percorrer o ciclo nominal de status até resolvida.
Pré-condições: M1. TOKEN_G. Nova demanda D5 de A com status registrada. SUPOSIÇÃO: a ordem do enum é o fluxo nominal permitido (L05).
Passos: 1. PATCH D5 para em_analise. 2. PATCH D5 para encaminhada. 3. PATCH D5 para em_atendimento. 4. PATCH D5 para resolvida. 5. Enviar GET {API}/demands/{id de D5} com TOKEN_G.
Resultado esperado: data.status = resolvida.
Pós-condições: D5 persistida como resolvida, com 4 itens de histórico acrescentados.
TC77 · Nível: Integração de componentes
ID: TC77
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Cancelar demanda com status registrada.
Pré-condições: M1. TOKEN_G. Nova demanda D6 de A com status registrada. SUPOSIÇÃO: registrada→cancelada é permitida (L05).
Passos: 1. Enviar PATCH {API}/demands/{id de D6}/status com {"status":"cancelada","observacaoGestor":"Duplicada."} e TOKEN_G.
Resultado esperado: HTTP 200 com data.status = cancelada.
Pós-condições: D6 persistida como cancelada.
TC78 · Nível: Sistema
ID: TC78
HU: HU-04 Acompanhar status e histórico
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Exibir ao cidadão o status alterado pelo gestor.
Pré-condições: M1, APP. D1 com status registrada. Gestor demo logado.
Passos: 1. Gestor abre D1 pelo painel. 2. Seleciona o status "em atendimento". 3. Informa a observação "Equipe acionada para vistoria.". 4. Salva. 5. Sair. 6. Entrar como cidadão A. 7. Abrir o detalhe de D1.
Resultado esperado: O detalhe de D1 exibe o status em atendimento.
Pós-condições: D1 persistida com status em_atendimento.
TC79 · Nível: Sistema
ID: TC79
HU: HU-05 Atualização de status
CA: CA-10 "O gestor deve conseguir atualizar status e observação da demanda."
Título: Exibir no histórico a observação registrada pelo gestor.
Pré-condições: M1, APP. D2 com status em_analise. Gestor demo logado. SUPOSIÇÃO: a observação aparece no item de histórico (L26).
Passos: 1. Gestor abre D2. 2. Seleciona o status "encaminhada". 3. Informa a observação "Enviado a SEOB.". 4. Salva. 5. Abrir o histórico de D2.
Resultado esperado: O histórico exibe um item com o texto "Enviado a SEOB.".
Pós-condições: D2 persistida como encaminhada, com o novo item de histórico.
TC80 · Nível: Sistema
ID: TC80
HU: HU-07 Painel do gestor
CA: CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente."
Título: Exibir no painel do gestor o total de demandas das métricas gerais.
Pré-condições: M1, APP. Gestor demo logado. Valor data.total de GET /metrics/summary com TOKEN_G = T.
Passos: 1. Abrir o painel do gestor.
Resultado esperado: O painel exibe o total T.
Pós-condições: Nenhum dado alterado.
TC81 · Nível: Sistema
ID: TC81
HU: HU-07 Painel do gestor
CA: CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente."
Título: Exibir na fila recente a demanda criada por último.
Pré-condições: M1, APP. Demanda D7 criada por A imediatamente antes do teste. Gestor demo logado. SUPOSIÇÃO: a fila recente ordena por criadaEm decrescente (L15).
Passos: 1. Abrir o painel do gestor. 2. Localizar a seção de fila recente.
Resultado esperado: A fila recente exibe D7 como primeiro item.
Pós-condições: Nenhum dado alterado.
TC82 · Nível: Sistema
ID: TC82
HU: HU-08 Revisão da triagem
CA: CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente."
Título: Exibir categoria, confiança e sugestão de encaminhamento na triagem.
Pré-condições: M1, APP. Demanda D8 com categoria, scoreTriagem e sugestaoEncaminhamento preenchidos (SUPOSIÇÃO: o fallback preenche o score, L04). Gestor demo logado.
Passos: 1. Abrir o painel do gestor. 2. Abrir a triagem de D8.
Resultado esperado: A tela exibe categoria, score e sugestão de encaminhamento iguais aos de GET /demands/{id de D8}.
Pós-condições: Nenhum dado alterado.
TC83 · Nível: Integração de componentes
ID: TC83
HU: HU-08 Revisão da triagem
CA: SUPOSIÇÃO
Título: Sugerir o órgão cujo categoriasJson contém a categoria da demanda.
Pré-condições: M1. TOKEN_A. GET /organs retorna um único órgão com vias_publicas em categoriasJson: "Secretaria de Obras". SUPOSIÇÃO: a sugestão sai de categoriasJson (L13).
Passos: 1. Enviar POST {API}/demands com categoria = vias_publicas e demais obrigatórios válidos.
Resultado esperado: data.sugestaoEncaminhamento = "Secretaria de Obras".
Pós-condições: Demanda persistida com a sugestão.
TC84 · Nível: Integração de componentes
ID: TC84
HU: HU-10 Dashboard do cidadão
CA: CA-08 "O dashboard do cidadão deve apresentar resumo das solicitações."
Título: Retornar ao cidadão métricas só das próprias demandas.
Pré-condições: M1. TOKEN_A.
Passos: 1. Enviar GET {API}/metrics/summary com TOKEN_A.
Resultado esperado: data.total = 3.
Pós-condições: Nenhum dado alterado.
TC85 · Nível: Integração de componentes
ID: TC85
HU: HU-07 Painel do gestor
CA: CA-09 "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente."
Título: Retornar ao gestor métricas gerais.
Pré-condições: M1. TOKEN_G. Contagem total de demandas no banco = N (via Prisma).
Passos: 1. Enviar GET {API}/metrics/summary com TOKEN_G.
Resultado esperado: data.total = N.
Pós-condições: Nenhum dado alterado.
TC86 · Nível: Integração de componentes
ID: TC86
HU: HU-07 Painel do gestor
CA: SUPOSIÇÃO
Título: Responder métricas sem Redis configurado.
Pré-condições: API iniciada com REDIS_URL vazio. M1. TOKEN_G.
Passos: 1. Enviar GET {API}/metrics/summary com TOKEN_G.
Resultado esperado: HTTP 200 com success: true.
Pós-condições: Nenhum dado alterado. API ativa.
TC87 · Nível: Integração de componentes
ID: TC87
HU: HU-07 Painel do gestor
CA: SUPOSIÇÃO
Título: Responder métricas com Redis configurado mas inacessível.
Pré-condições: API iniciada com REDIS_URL=redis://127.0.0.1:6399 (porta sem serviço). M1. TOKEN_G. Contagem total no banco = N. SUPOSIÇÃO: com Redis fora do ar, a API lê do banco (L14).
Passos: 1. Enviar GET {API}/metrics/summary com TOKEN_G.
Resultado esperado: HTTP 200 com data.total = N.
Pós-condições: API continua ativa (GET /health responde ok).
TC88 · Nível: Sistema
ID: TC88
HU: HU-10 Dashboard do cidadão
CA: CA-08 "O dashboard do cidadão deve apresentar resumo das solicitações."
Título: Exibir no dashboard do cidadão o total das próprias solicitações.
Pré-condições: M1, APP. Cidadão A logado. SUPOSIÇÃO: o resumo usa GET /metrics/summary (L16).
Passos: 1. Abrir o dashboard do cidadão.
Resultado esperado: O dashboard exibe o total 3.
Pós-condições: Nenhum dado alterado.
TC89 · Nível: Sistema
ID: TC89
HU: HU-02 Login
CA: CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."
Título: Navegar da home para a tela de login.
Pré-condições: M0, APP. Navegador sem sessão.
Passos: 1. Abrir a home. 2. Acionar o link ou botão de login.
Resultado esperado: O APP exibe a tela de login.
Pós-condições: Nenhum dado alterado.
TC90 · Nível: Sistema
ID: TC90
HU: HU-01 Cadastro de conta
CA: CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."
Título: Navegar da home para a tela de cadastro.
Pré-condições: M0, APP. Navegador sem sessão.
Passos: 1. Abrir a home. 2. Acionar o link ou botão de cadastro.
Resultado esperado: O APP exibe a tela de cadastro.
Pós-condições: Nenhum dado alterado.
TC91 · Nível: Sistema
ID: TC91
HU: HU-06 Visualizar e filtrar demandas
CA: CA-01 "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."
Título: Navegar da home para a tela de demandas.
Pré-condições: M1, APP. Cidadão A logado (SUPOSIÇÃO: demandas exige sessão).
Passos: 1. Abrir a home. 2. Acionar o link ou botão de demandas.
Resultado esperado: O APP exibe a listagem de demandas.
Pós-condições: Nenhum dado alterado.
TC92 · Nível: Sistema
ID: TC92
HU: HU-03 Registro de demanda
CA: CA-12 "A interface deve ser utilizável em mobile, tablet e desktop."
Título: Registrar demanda em viewport mobile sem rolagem horizontal.
Pré-condições: M1, APP. Viewport 375×812. Cidadão A logado. SUPOSIÇÃO: "utilizável" = fluxo concluído com scrollWidth ≤ largura do viewport (L22).
Passos: 1. Executar os passos de TC41 no viewport 375×812. 2. Em cada tela, medir document.documentElement.scrollWidth.
Resultado esperado: O fluxo termina na tela de detalhe com scrollWidth ≤ 375 em todas as telas.
Pós-condições: Nova demanda de A persistida.
TC93 · Nível: Sistema
ID: TC93
HU: HU-03 Registro de demanda
CA: CA-12 "A interface deve ser utilizável em mobile, tablet e desktop."
Título: Registrar demanda em viewport tablet sem rolagem horizontal.
Pré-condições: Iguais às de TC92, com viewport 768×1024.
Passos: 1. Executar os passos de TC41 no viewport 768×1024. 2. Em cada tela, medir document.documentElement.scrollWidth.
Resultado esperado: O fluxo termina na tela de detalhe com scrollWidth ≤ 768 em todas as telas.
Pós-condições: Nova demanda de A persistida.
TC94 · Nível: Sistema
ID: TC94
HU: HU-03 Registro de demanda
CA: CA-12 "A interface deve ser utilizável em mobile, tablet e desktop."
Título: Registrar demanda em viewport desktop sem rolagem horizontal.
Pré-condições: Iguais às de TC92, com viewport 1440×900.
Passos: 1. Executar os passos de TC41 no viewport 1440×900. 2. Em cada tela, medir document.documentElement.scrollWidth.
Resultado esperado: O fluxo termina na tela de detalhe com scrollWidth ≤ 1440 em todas as telas.
Pós-condições: Nova demanda de A persistida.
5. Matriz de rastreabilidade
Caso	HU	CA	Trecho literal	Suposição?
TC01	HU-01	CA-03	"O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."	N
TC02	HU-01	—	"Cookie HTTP-only urbanize_session, criado automaticamente nos endpoints de login e cadastro."	N
TC03	HU-01	CA-03	"role | UserRole | nao | Padrao: cidadao"	N
TC04	HU-01	CA-03	"UserRole: cidadao, gestor"	N
TC05	HU-01	CA-03	"422 | VALIDATION_ERROR | Corpo ou query string invalidos"	N
TC06	HU-01	CA-03	"nome | string | sim | Minimo 2 caracteres"	N
TC07	HU-01	CA-03	"nome | string | sim | Minimo 2 caracteres"	N
TC08	HU-01	CA-03	"senha | string | sim | Minimo 1 caractere"	N
TC09	HU-01	CA-03	"senha | string | sim | Minimo 1 caractere"	N
TC10	HU-01	CA-03	"email | string | sim | Email valido e unico"	N
TC11	HU-01	CA-03	"409 | EMAIL_ALREADY_EXISTS | Email ja cadastrado"	N
TC12	HU-01	CA-03	"O cadastro deve aceitar dados válidos, perfil e criar usuário no backend."	N
TC13	HU-02	CA-02	"O login deve permitir entrada com perfis de cidadão e gestor."	N
TC14	HU-02	CA-02	"O login deve permitir entrada com perfis de cidadão e gestor."	N
TC15	HU-02	CA-02	"401 | INVALID_CREDENTIALS | Email ou senha invalidos"	N
TC16	HU-02	CA-02	"401 | INVALID_CREDENTIALS | Email ou senha invalidos"	N
TC17	HU-02	—	(obrigatoriedade dos campos do login não declarada)	S
TC18	HU-02	CA-02	"acessar as funcionalidades correspondentes ao meu perfil" (destino não definido)	S
TC19	HU-02	CA-02	"acessar as funcionalidades correspondentes ao meu perfil" (destino não definido)	S
TC20	HU-02	—	"Serviços do app (api, authService, session)" (comportamento não descrito)	S
TC21	HU-02	—	"Header Authorization: Bearer <token>." (uso pelo app não declarado)	S
TC22	HU-02	—	"401 | UNAUTHENTICATED | Requisicao sem sessao"	N
TC23	HU-02	—	"401 | INVALID_TOKEN | Token invalido ou expirado"	N
TC24	HU-02	—	"401 | INVALID_TOKEN | Token invalido ou expirado"	N
TC25	HU-02	—	"Cookie HTTP-only urbanize_session" / "Retorna o usuario autenticado."	N
TC26	HU-02	—	"Remove o cookie de sessao."	N
TC27	—	—	"404 | NOT_FOUND | Rota inexistente" (sem HU)	N
TC28	HU-03	CA-05	"Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe."	N
TC29	HU-03	—	(status inicial não declarado)	S
TC30	HU-03	—	"prioridade | media"	N
TC31	HU-03	—	"endereco.bairro | Nao informado" / "endereco.cidade | Recife"	N
TC32	HU-03	—	"nomeSolicitante | Nome do usuario autenticado"	N
TC33	HU-03	—	"titulo | string com minimo 3 caracteres"	N
TC34	HU-03	—	"titulo | string com minimo 3 caracteres" / "descricao | string com minimo 5 caracteres"	N
TC35	HU-03	—	"descricao | string com minimo 5 caracteres"	N
TC36	HU-03	CA-04	"endereco.endereco | string com minimo 3 caracteres"	N
TC37	HU-03	—	"categoria | DemandCategory" (campo obrigatório)	N
TC38	HU-03	—	"categoria | DemandCategory"	N
TC39	HU-03	—	"DemandPriority: baixa, media, alta"	N
TC40	HU-03	—	"Endpoints protegidos exigem uma dessas credenciais validas."	N
TC41	HU-03	CA-05	"Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe."	N
TC42	HU-03	CA-04	"exigir localização e aceite de compartilhamento de dados"	N
TC43	HU-03	CA-04	"exigir localização e aceite de compartilhamento de dados"	N
TC44	HU-03	CA-04	"preencher título/descrição pela triagem"	N
TC45	HU-12	CA-04	"quero anexar fotos ao registrar uma demanda"	N
TC46	HU-12	CA-04	"Envia imagem para triagem."	N
TC47	HU-12	—	"400 | NO_FILE | Upload sem arquivo"	N
TC48	HU-12	—	"Autenticacao: obrigatoria." (POST /upload/image)	N
TC49	HU-08	—	"Quando Google Vision nao estiver configurado, a API usa a categoria enviada pelo frontend como fallback."	N
TC50	HU-08	—	"Fallback para categoria manual quando o Google Vision falha" (comportamento em falha não descrito no contrato)	S
TC51	HU-03	CA-04	"a API usa a categoria enviada pelo frontend como fallback."	N
TC52	HU-06	CA-06	"Cidadao: cria demandas, lista apenas suas demandas"	N
TC53	HU-06	CA-06	"se estiver sem orgao, lista a fila geral." (massa do seed presumida)	N
TC54	HU-06	CA-06	"lista demandas do seu orgao quando possui vinculo" (mecanismo de vínculo ausente)	S
TC55	HU-06	CA-06	"status | DemandStatus"	N
TC56	HU-06	CA-06	"categoria | DemandCategory"	N
TC57	HU-06	CA-06	"prioridade | DemandPriority"	N
TC58	HU-06	CA-06	"bairro | string" (tipo de comparação não definido)	S
TC59	HU-06	CA-06	"busca | string" (campos buscados não definidos)	S
TC60	HU-06	CA-06	(semântica de combinação não definida)	S
TC61	HU-06	CA-06	"422 | VALIDATION_ERROR | Corpo ou query string invalidos"	N
TC62	HU-06	CA-06	"A listagem deve exibir demandas e aplicar filtros corretamente."	N
TC63	HU-06	CA-11	"O sistema deve exibir estados adequados de carregamento, erro e vazio."	N
TC64	HU-06	CA-11	"O sistema deve exibir estados adequados de carregamento, erro e vazio."	N
TC65	HU-06	CA-11	"O sistema deve exibir estados adequados de carregamento, erro e vazio."	N
TC66	HU-04	CA-07	"Cidadao so acessa demandas que criou."	N
TC67	HU-04	—	"Cidadao so acessa demandas que criou." (código de erro não definido)	N
TC68	HU-04	—	"404 | DEMAND_NOT_FOUND | Demanda inexistente"	N
TC69	HU-04	CA-07	"A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico."	N
TC70	HU-05	CA-10	"Permissao: somente gestor."	N
TC71	HU-05	CA-10	"Resposta: objeto de demanda atualizado, com novo item no historico."	N
TC72	HU-05	CA-10	"403 | FORBIDDEN | Usuario sem permissao para a acao"	N
TC73	HU-05	—	"401 | UNAUTHENTICATED | Requisicao sem sessao"	N
TC74	HU-05	CA-10	"422 | VALIDATION_ERROR | Corpo ou query string invalidos"	N
TC75	HU-05	—	"404 | DEMAND_NOT_FOUND | Demanda inexistente"	N
TC76	HU-05	CA-10	(transições permitidas não especificadas)	S
TC77	HU-05	CA-10	(transição para cancelada não especificada)	S
TC78	HU-04	CA-10	"O gestor deve conseguir atualizar status e observação da demanda."	N
TC79	HU-05	CA-10	"registrar observações na demanda para manter o histórico do atendimento rastreável"	N
TC80	HU-07	CA-09	"O painel do gestor deve apresentar métricas, fila recente e triagem inteligente."	N
TC81	HU-07	CA-09	"fila recente" (critério de ordenação não definido)	S
TC82	HU-08	CA-09	"revisar a triagem automática para validar categoria, confiança e sugestão de encaminhamento"	N
TC83	HU-08	—	(regra categoria→órgão não descrita; só o exemplo categoriasJson)	S
TC84	HU-10	CA-08	"Cidadao recebe metricas das proprias demandas."	N
TC85	HU-07	CA-09	"Gestor recebe metricas gerais."	N
TC86	HU-07	—	"REDIS_URL | vazio | Redis opcional para cache"	N
TC87	HU-07	—	(Redis configurado e indisponível não descrito)	S
TC88	HU-10	CA-08	"O dashboard do cidadão deve apresentar resumo das solicitações."	N
TC89	HU-02	CA-01	"O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."	N
TC90	HU-01	CA-01	"O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."	N
TC91	HU-06	CA-01	"O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas."	N
TC92	HU-03	CA-12	"A interface deve ser utilizável em mobile, tablet e desktop." (critério "utilizável" definido por suposição)	S
TC93	HU-03	CA-12	idem	S
TC94	HU-03	CA-12	idem	S

Resumo: 94 casos (Componente: 4 · Integração de componentes: 63 · Sistema: 27). 21 casos dependem de suposição.

O que ficou sem caso:

HU-09: não tem endpoint (L12).
HU-11 e HU-13: fora do escopo.
CA-13: é critério de processo, não dá para testar como caso (L23).

O que precisa de decisão antes de rodar:

L05: transições de status. Destrava TC76, TC77 e as transições reversas.
L09: vínculo gestor↔órgão. Destrava TC54.
L10: cadastro público com perfil gestor. É um risco de segurança, não só uma lacuna de teste.

Posso publicar tudo isso como página compartilhável para a squad, se quiserem.
