# Plano de Testes e Backlog de Automação

*Do escopo ao backlog priorizado, em seis decisões encadeadas.*

| Campo | Conteúdo |
| --- | --- |
| Equipe / Squad | Equipe 2 |
| Produto / SUT | Urbanize |
| Integrantes | Diego David, Pamela Rodrigues, Hyngrid Souza, Enzo Antuna, Janderson |
| Data | 23/09/2026 |

## 1. Escopo

*O que a atividade de teste se compromete a verificar, e o que ela declaradamente não verifica.*

Entra no escopo: os fluxos principais do produto ponta a ponta, as regras que protegem esses fluxos e o contrato que os sustenta, incluindo o comportamento do produto na fronteira quando uma dependência externa falha.

Fica fora do escopo: o comportamento de sistemas externos fora do controle da squad, os recursos físicos do dispositivo e o que custa mais do que devolve no prazo do projeto.

| Item | Dentro do escopo? | Motivo |
| --- | --- | --- |
| Cadastro e login com JWT (Cidadão e Gestor) | Sim | Porta de entrada de todos os fluxos. É onde o perfil do usuário é definido |
| Registro de demanda com categoria, descrição, foto e localização | Sim | Fluxo principal do produto. A regra de negócio fica concentrada aqui |
| Listagem "Minhas demandas" com filtros e detalhe com timeline de status | Sim | Fluxo principal do cidadão (etapa de engajamento da jornada) |
| Fila do gestor: alterar status, adicionar observação, revisar triagem | Sim | Fluxo principal do gestor. Fecha o ciclo da demanda |
| Controle de acesso por perfil (API e useRoleGuard no app) | Sim | Regra que protege os fluxos. Uma falha aqui expõe dados ou ações de outro perfil |
| Validação de entrada e códigos de erro da API REST (contrato) | Sim | Contrato que sustenta o app. Quebrar o contrato quebra o mobile sem aviso |
| Fallback para categoria manual quando o Google Vision falha ou não está configurado | Sim | Comportamento do produto na fronteira com a dependência externa |
| Classificação automática da imagem pelo Google Vision (acurácia) | Não | Comportamento de terceiro, não determinístico e fora do controle da squad |
| Câmera, galeria e precisão do GPS do aparelho | Não | Recurso físico do dispositivo. Nos testes, a imagem e a coordenada são injetadas |
| Execução física do reparo pela prefeitura | Não | Processo externo ao sistema, sem artefato verificável no produto |
| Métricas funcionando com o Redis indisponível | Sim | O Redis é opcional por design. A API precisa responder sem ele |
| Testes de carga e desempenho | Não | Custa mais do que devolve no prazo. O MVP não tem meta de volume definida |
| Matriz de aparelhos e versões de Android/iOS | Não | Custa mais do que devolve no prazo. |
| Sugestão de órgão responsável a partir da categoria | Sim | Regra de negócio interna, determinística, sob controle da squad |
| Estados de carregamento, erro e lista vazia | Sim | Comportamento visível ao usuário quando a rede ou o backend falham |

**Verificação**

- Todo fluxo principal do produto aparece como Sim.
- Toda linha Não tem motivo.

## 2. Níveis de teste

*Em que altura do sistema cada condição é verificada, e quanto essa escolha custa.*

> **Atividade:** declarar no plano os níveis em que ele atua, com uma frase de justificativa por nível incluído e por nível excluído.

| Nível | O que responde | Dentro do plano? | Justificativa |
| --- | --- | --- | --- |
| Componente | A unidade isolada faz o que promete? | Sim | Os serviços do app (api, authService, session) e os hooks têm regra própria que dá para isolar com a rede mockada (Jest/jest-expo). É o nível mais barato e rápido para essas regras. |
| Integração de componentes | As partes conversam entre si corretamente? | Sim | A maior parte das regras do escopo (validação, controle de acesso por perfil, status e histórico, fallback do Vision, métricas sem Redis) vive na API Express + Prisma. O Supertest verifica o contrato sem depender da interface. |
| Sistema | O sistema inteiro entrega o comportamento esperado? | Sim | Os fluxos principais (registrar demanda com protocolo, gestor altera status e cidadão vê) atravessam app, API e banco. Só o teste ponta a ponta (Playwright no Expo web) mostra que eles funcionam juntos. |
| Integração de sistemas | O produto conversa bem com sistemas de terceiros? | Não | Google Vision e Redis são sistemas de terceiros e a acurácia do Vision está fora do escopo. O plano verifica só a reação do Urbanize na fronteira (Vision desligado ou falhando, Redis ausente), o que já é coberto em Integração de componentes. |
| Aceite | O usuário real aceita o que foi entregue? | Não | Não há cidadãos nem gestores reais da prefeitura disponíveis no prazo do projeto. A squad verifica os critérios de aceite nos níveis acima, mas não substitui o aceite do usuário. |

## 3. Riscos da atividade de teste

*O que pode dar errado na própria verificação, e enganar quem lê o resultado.*

> **Atividade:** montar a matriz de risco da atividade de teste.

*Na verificação manual: roteiro que deixa de ser executado quando o prazo aperta, execução inconsistente entre pessoas sem passo a passo definido, resultado registrado sem evidência que permita reconferir, caso aprovado por quem escreveu o código que ele verifica, repetição sem atenção.*

*Na verificação automatizada: teste instável, oráculo copiado do próprio SUT, duplo de teste que não representa o produto implantado, massa compartilhada entre casos, conjunto de casos verde que nunca soube ficar vermelho.*

*Uma forma mitiga o risco da outra. A exceção é quando o risco é interno a uma das formas: aí a mitigação vem de dentro dela.*

| Risco | Impacto | Prob. | Mitigação |
| --- | --- | --- | --- |
| Execução inconsistente entre pessoas, sem passo a passo definido | Médio | Média | Cada caso traz passo a passo, dados de entrada fixos (usuário do seed, categoria, descrição) e resultado esperado. |
| Resultado registrado sem evidência que permita reconferir | Médio | Alta | Print ou log anexado a cada execução, guardado em docs/evidencias-testes-api/ |
| Massa compartilhada entre casos, criando dependência e ordem | Alto | Alta | Criar massa de dado isolada por execução. |
| Roteiro manual deixa de ser executado quando o prazo aperta | Alto | Alta | Os 13 casos que permanecem manuais (seção 5) têm responsável e entram num checklist obrigatório antes de cada entrega. Os casos de alta frequência foram para a automação. |
| Caso aprovado por quem escreveu o código que ele verifica | Médio | Alta | Revisão cruzada: quem executa o caso manual ou revisa o teste automatizado no PR não é o autor do código testado. |
| Repetição manual sem atenção | Médio | Média | Casos repetidos a cada push (API e componente) são automatizados. Os manuais trazem resultado esperado exato para comparar, não para "dar uma olhada". |
| Teste automatizado instável (SQLite compartilhado, espera por tempo fixo) | Alto | Média | Backend roda com --runInBand para evitar disputa pelo dev.db. No Playwright, espera por condição (expect/locator), nunca waitForTimeout. Teste que falhar sem mudança de código é investigado antes de ser reexecutado. |
| Oráculo copiado do próprio SUT | Alto | Média | O resultado esperado vem do trecho do requisito ou do contrato citado na matriz 4.5, não do código. Os testes CT-\* já existentes são revisados contra essa matriz antes de serem reaproveitados. |
| Duplo de teste que não representa o produto implantado (Vision, Redis, rede mockada) | Alto | Média | Os duplos reproduzem o formato real de resposta e de erro registrado no contrato. Os fluxos principais (TC41, TC78) rodam contra API e banco reais, sem mock. |
| Conjunto de casos verde que nunca soube ficar vermelho | Alto | Média | Ao criar cada teste, a regra é quebrada de propósito (ex.: remover a checagem de perfil no PATCH) e o teste precisa falhar antes do merge. |

**Verificação**

- Cada risco tem mitigação concreta.

## 4. Casos de teste

*Derivados dos requisitos.*

### 4.1 Primeira rodada com IA

> **Atividade:** gerar casos de teste com IA, usando o prompt que a squad usaria hoje. Não corrigir a saída. Guardar o prompt e o resultado.

**Prompt usado**

Gere casos de teste para o Urbanize, um aplicativo mobile de gestão de demandas urbanas.

O cidadão cria demandas com foto, descrição e localização e acompanha o status.

O gestor vê a fila de demandas, revisa a triagem automática por imagem e altera o status.

Quero casos de teste completos cobrindo as funcionalidades principais.

**Saída recebida**

Commit dessa entrega: [`adeb036`](https://github.com/mxs2/urbanize/commit/adeb036aacc7d7b422e36df28d459cd7c5a1a62e)

Arquivo: [`ia/saida-rodada-1.md`](ia/saida-rodada-1.md)

**Três perguntas sobre a saída**

| Pergunta | Resposta | O que se observou na saída |
| --- | --- | --- |
| A LLM identificou lacunas? | Não | Não identificou lacunas |
| Distribuiu os casos entre níveis? | Não | Cada caso veio com um “tipo”, mas não o nível |
| Indicou as técnicas de modelagem? | Não | Não citou nenhuma técnica |

### 4.2 Segunda rodada

> **Atividade:** refazer o prompt com os quatro insumos e os três pedidos, comparar as duas saídas e registrar o que mudou.

**Insumos fornecidos no prompt**

- **Requisitos:** as histórias de usuário e os critérios de aceite, na íntegra
- **Formato esperado:** os campos exatos dos casos de testes: id, HU, CA, título, pré-condições, passos, resultados esperados, pós-condições
- **Escopo:** o que está dentro e o que está fora
- **Níveis de teste:** quais níveis o plano cobre

**Prompt revisado**

Prompt disponível em [`ia/prompt-rodada-2.md`](ia/prompt-rodada-2.md).

**O que mudou entre as duas saídas**

Na rodada 1, a IA leu o código e tirou dele os resultados esperados. Ela sinalizou só 3 lacunas, os casos saíram sem HU, CA e pós-condições, e o "tipo" (API/UI/Manual) era ferramenta, não nível de teste. Na rodada 2, recebendo os quatro insumos, a IA listou 31 lacunas antes de gerar qualquer caso, derivou 28 regras nomeando a técnica de cada uma e entregou 94 casos nos 8 campos pedidos, cada um com nível e com o trecho literal do requisito ou do contrato. Onde não havia trecho, ela marcou suposição (19 casos). O volume caiu pouco (de 115 para 94). A mudança foi de rastreabilidade, não de quantidade.

Saída íntegra da rodada 2 em [`ia/saida-rodada-2.md`](ia/saida-rodada-2.md), registrada no commit [`1e27ff5`](https://github.com/mxs2/urbanize/commit/1e27ff5a6b43b265d1636bd52f07f2c3388c2785).

### 4.3 Matriz de alocação

*Pedida antes da geração dos casos.*

| Condição de teste | Nível responsável | Justificativa |
| --- | --- | --- |
| Validação de campos de /auth/register (limites, enums, unicidade) | Integração de componentes | A regra fica na rota Express + Prisma. Supertest isola a regra da interface. |
| Login, credencial inválida, token inválido/expirado, cookie | Integração de componentes | Contrato HTTP e cabeçalhos Set-Cookie, verificáveis só na API. |
| Armazenar token e enviar Bearer no app | Componente | Regra de authService/session/api com HTTP mockado. |
| Criação de demanda: obrigatórios, limites, padrões, protocolo | Integração de componentes | Regra de negócio e persistência na API/banco. |
| Travas do formulário (localização, aceite) e preenchimento pela triagem | Componente + Sistema | Hook tem regra própria (Componente). A trava vista pelo usuário é fluxo de ponta a ponta (Sistema). |
| Upload: sucesso, NO_FILE, autenticação | Integração de componentes | Multer + rota, verificável por multipart via Supertest. |
| Fallback do Vision | Integração de componentes | Reação da API com Vision desligado ou falhando. Vision real está fora do escopo. |
| Visibilidade por perfil (listagem, detalhe) | Integração de componentes | Controle de acesso fica na API. A interface não é barreira de segurança. |
| Filtros da listagem | Integração de componentes + Sistema | A query string é regra da API. A aplicação do filtro na tela é fluxo do usuário. |
| Mudança de status, histórico, permissão do PATCH | Integração de componentes | Regra e persistência de estado. |
| Ciclo gestor altera status e cidadão vê | Sistema | Atravessa dois perfis, app, API e banco. |
| Métricas por perfil e com Redis indisponível | Integração de componentes | Depende de configuração do backend (REDIS_URL). |
| Sugestão de órgão por categoria | Integração de componentes | Regra interna determinística na API. |
| Painel do gestor, dashboard do cidadão, detalhe | Sistema | Exibição integrada de dados reais. |
| Estados de carregamento, erro e vazio | Componente (loading) + Sistema (vazio/erro) | Loading é transitório e testável de forma determinística no hook. Vazio e erro dependem de backend real ou parado. |
| Navegação a partir da home | Sistema | Rotas do app. |
| Responsividade (3 viewports) | Sistema | Playwright com viewport. A matriz de aparelhos fica fora do escopo. |

### 4.4 Tabela intermediária de derivação

*Uma linha por regra do requisito.*

| Regra | Técnica aplicável | Condições derivadas | Casos resultantes |
| --- | --- | --- | --- |
| R01 nome com mínimo de 2 | Valor limite | 1 caractere (inválido), 2 (válido) | TC06, TC07 |
| R02 senha com mínimo de 1 | Valor limite | 0 (inválido), 1 (válido) | TC08, TC09 |
| R03 email válido e único | Partição de equivalência | Válido e novo, formato inválido, já cadastrado | TC01, TC10, TC11 |
| R04 role | Partição de equivalência | Omitido→cidadao, gestor, fora do enum | TC03, TC04, TC05 |
| R05 Cookie de sessão | Partição de equivalência | Cadastro cria cookie, logout remove, cookie autentica | TC02, TC25, TC26 |
| R06 Login | Tabela de decisão | E-mail existe × senha correta → sucesso por perfil / INVALID_CREDENTIALS. Corpo incompleto | TC13–TC17 |
| R07 Autenticação de rotas protegidas | Partição de equivalência | Sem credencial, token adulterado, token expirado, cookie válido | TC22–TC25, TC40, TC48, TC73 |
| R08 Obrigatórios de POST /demands | Valor limite | titulo 2/3, descricao 4/5, endereco.endereco 2/3 | TC33, TC34, TC35, TC36 |
| R09 categoria/prioridade | Partição de equivalência | Ausente, fora do enum, válida | TC37, TC38, TC39, TC28 |
| R10 Padrões dos opcionais | Partição de equivalência | Opcionais omitidos | TC30, TC31, TC32 |
| R11 Protocolo e status inicial | Partição de equivalência | Criação válida | TC28, TC29 |
| R12 Envio do formulário (CA-04) | Tabela de decisão | Localização (S/N) × aceite (S/N) → envia só com S/S | TC41, TC42, TC43 |
| R13 Triagem preenche o formulário | Partição de equivalência | Upload com sugestão | TC44 |
| R14 Upload | Partição de equivalência | Com arquivo, sem arquivo, sem autenticação, foto vinculada | TC45–TC48 |
| R15 Fallback do Vision | Tabela de decisão | Vision configurado (S/N) × funciona (S/N) × categoria enviada → categoria final | TC49, TC50, TC51 |
| R16 Visibilidade da listagem | Tabela de decisão | Perfil × vínculo com órgão → próprias / do órgão / fila geral | TC52, TC53, TC54 |
| R17 Filtros | Partição de equivalência | Cada parâmetro válido, combinação, enum inválido | TC55–TC62 |
| R18 Acesso ao detalhe | Tabela de decisão | Dono × existe → 200 / recusa / 404 | TC66, TC67, TC68, TC69 |
| R19 Permissão do PATCH | Partição de equivalência | Gestor, cidadão, sem autenticação, id inexistente, status inválido | TC70, TC72–TC75 |
| R20 Ciclo de status | Transição de estados | registrada→em_analise→encaminhada→em_atendimento→resolvida, registrada→cancelada, cada transição gera histórico | TC71, TC76, TC77, TC78, TC79 |
| R21 Métricas | Partição de equivalência | Cidadão, gestor, Redis ausente, Redis inacessível | TC84–TC87 |
| R22 Sugestão de órgão | Tabela de decisão | Categoria com órgão mapeado → nome do órgão | TC83 |
| R23 Estados de interface | Partição de equivalência | Carregando, vazio, erro | TC63, TC64, TC65 |
| R24 Telas agregadoras | Partição de equivalência | Painel (métricas, fila, triagem), dashboard | TC80, TC81, TC82, TC88 |
| R25 Navegação e responsividade | Partição de equivalência | 3 destinos a partir da home, 3 viewports | TC89–TC94 |
| R26 Sessão no app | Partição de equivalência | Login guarda token, requisição leva Bearer | TC20, TC21 |
| R27 Rota inexistente | Partição de equivalência | Caminho desconhecido | TC27 |
| R28 Cadastro e login pela interface | Partição de equivalência | Cidadão, gestor | TC12, TC18, TC19 |

### 4.5 Matriz de rastreabilidade de evidências

*Onde não houver trecho do requisito, a linha é marcada como suposição em vez de virar regra.*

| Caso | HU | CA | Trecho citado | Suposição? (S/N) |
| --- | --- | --- | --- | --- |
| TC01 | HU-01 | CA-03 | "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." | N |
| TC02 | HU-01 | — | "Cookie HTTP-only urbanize_session, criado automaticamente nos endpoints de login e cadastro." | N |
| TC03 | HU-01 | CA-03 | "role \| UserRole \| nao \| Padrao: cidadao" | N |
| TC04 | HU-01 | CA-03 | "UserRole: cidadao, gestor" | N |
| TC05 | HU-01 | CA-03 | "422 \| VALIDATION_ERROR \| Corpo ou query string invalidos" | N |
| TC06 | HU-01 | CA-03 | "nome \| string \| sim \| Minimo 2 caracteres" | N |
| TC07 | HU-01 | CA-03 | "nome \| string \| sim \| Minimo 2 caracteres" | N |
| TC08 | HU-01 | CA-03 | "senha \| string \| sim \| Minimo 1 caractere" | N |
| TC09 | HU-01 | CA-03 | "senha \| string \| sim \| Minimo 1 caractere" | N |
| TC10 | HU-01 | CA-03 | "email \| string \| sim \| Email valido e unico" | N |
| TC11 | HU-01 | CA-03 | "409 \| EMAIL_ALREADY_EXISTS \| Email ja cadastrado" | N |
| TC12 | HU-01 | CA-03 | "O cadastro deve aceitar dados válidos, perfil e criar usuário no backend." | N |
| TC13 | HU-02 | CA-02 | "O login deve permitir entrada com perfis de cidadão e gestor." | N |
| TC14 | HU-02 | CA-02 | "O login deve permitir entrada com perfis de cidadão e gestor." | N |
| TC15 | HU-02 | CA-02 | "401 \| INVALID_CREDENTIALS \| Email ou senha invalidos" | N |
| TC16 | HU-02 | CA-02 | "401 \| INVALID_CREDENTIALS \| Email ou senha invalidos" | N |
| TC17 | HU-02 | — | (obrigatoriedade dos campos do login não declarada) | S |
| TC18 | HU-02 | CA-02 | "acessar as funcionalidades correspondentes ao meu perfil" (destino não definido) | S |
| TC19 | HU-02 | CA-02 | "acessar as funcionalidades correspondentes ao meu perfil" (destino não definido) | S |
| TC20 | HU-02 | — | "Serviços do app (api, authService, session)" (comportamento não descrito) | S |
| TC21 | HU-02 | — | "Header Authorization: Bearer \<token\>." (uso pelo app não declarado) | S |
| TC22 | HU-02 | — | "401 \| UNAUTHENTICATED \| Requisicao sem sessao" | N |
| TC23 | HU-02 | — | "401 \| INVALID_TOKEN \| Token invalido ou expirado" | N |
| TC24 | HU-02 | — | "401 \| INVALID_TOKEN \| Token invalido ou expirado" | N |
| TC25 | HU-02 | — | "Cookie HTTP-only urbanize_session" / "Retorna o usuario autenticado." | N |
| TC26 | HU-02 | — | "Remove o cookie de sessao." | N |
| TC27 | — | — | "404 \| NOT_FOUND \| Rota inexistente" (sem HU) | N |
| TC28 | HU-03 | CA-05 | "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe." | N |
| TC29 | HU-03 | — | (status inicial não declarado) | S |
| TC30 | HU-03 | — | "prioridade \| media" | N |
| TC31 | HU-03 | — | "endereco.bairro \| Nao informado" / "endereco.cidade \| Recife" | N |
| TC32 | HU-03 | — | "nomeSolicitante \| Nome do usuario autenticado" | N |
| TC33 | HU-03 | — | "titulo \| string com minimo 3 caracteres" | N |
| TC34 | HU-03 | — | "titulo \| string com minimo 3 caracteres" / "descricao \| string com minimo 5 caracteres" | N |
| TC35 | HU-03 | — | "descricao \| string com minimo 5 caracteres" | N |
| TC36 | HU-03 | CA-04 | "endereco.endereco \| string com minimo 3 caracteres" | N |
| TC37 | HU-03 | — | "categoria \| DemandCategory" (campo obrigatório) | N |
| TC38 | HU-03 | — | "categoria \| DemandCategory" | N |
| TC39 | HU-03 | — | "DemandPriority: baixa, media, alta" | N |
| TC40 | HU-03 | — | "Endpoints protegidos exigem uma dessas credenciais validas." | N |
| TC41 | HU-03 | CA-05 | "Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe." | N |
| TC42 | HU-03 | CA-04 | "exigir localização e aceite de compartilhamento de dados" | N |
| TC43 | HU-03 | CA-04 | "exigir localização e aceite de compartilhamento de dados" | N |
| TC44 | HU-03 | CA-04 | "preencher título/descrição pela triagem" | N |
| TC45 | HU-12 | CA-04 | "quero anexar fotos ao registrar uma demanda" | N |
| TC46 | HU-12 | CA-04 | "Envia imagem para triagem." | N |
| TC47 | HU-12 | — | "400 \| NO_FILE \| Upload sem arquivo" | N |
| TC48 | HU-12 | — | "Autenticacao: obrigatoria." (POST /upload/image) | N |
| TC49 | HU-08 | — | "Quando Google Vision nao estiver configurado, a API usa a categoria enviada pelo frontend como fallback." | N |
| TC50 | HU-08 | — | "Fallback para categoria manual quando o Google Vision falha" (comportamento em falha não descrito no contrato) | S |
| TC51 | HU-03 | CA-04 | "a API usa a categoria enviada pelo frontend como fallback." | N |
| TC52 | HU-06 | CA-06 | "Cidadao: cria demandas, lista apenas suas demandas" | N |
| TC53 | HU-06 | CA-06 | "se estiver sem orgao, lista a fila geral." (massa do seed presumida) | N |
| TC54 | HU-06 | CA-06 | "lista demandas do seu orgao quando possui vinculo" (mecanismo de vínculo ausente) | S |
| TC55 | HU-06 | CA-06 | "status \| DemandStatus" | N |
| TC56 | HU-06 | CA-06 | "categoria \| DemandCategory" | N |
| TC57 | HU-06 | CA-06 | "prioridade \| DemandPriority" | N |
| TC58 | HU-06 | CA-06 | "bairro \| string" (tipo de comparação não definido) | S |
| TC59 | HU-06 | CA-06 | "busca \| string" (campos buscados não definidos) | S |
| TC60 | HU-06 | CA-06 | (semântica de combinação não definida) | S |
| TC61 | HU-06 | CA-06 | "422 \| VALIDATION_ERROR \| Corpo ou query string invalidos" | N |
| TC62 | HU-06 | CA-06 | "A listagem deve exibir demandas e aplicar filtros corretamente." | N |
| TC63 | HU-06 | CA-11 | "O sistema deve exibir estados adequados de carregamento, erro e vazio." | N |
| TC64 | HU-06 | CA-11 | "O sistema deve exibir estados adequados de carregamento, erro e vazio." | N |
| TC65 | HU-06 | CA-11 | "O sistema deve exibir estados adequados de carregamento, erro e vazio." | N |
| TC66 | HU-04 | CA-07 | "Cidadao so acessa demandas que criou." | N |
| TC67 | HU-04 | — | "Cidadao so acessa demandas que criou." (código de erro não definido) | N |
| TC68 | HU-04 | — | "404 \| DEMAND_NOT_FOUND \| Demanda inexistente" | N |
| TC69 | HU-04 | CA-07 | "A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico." | N |
| TC70 | HU-05 | CA-10 | "Permissao: somente gestor." | N |
| TC71 | HU-05 | CA-10 | "Resposta: objeto de demanda atualizado, com novo item no historico." | N |
| TC72 | HU-05 | CA-10 | "403 \| FORBIDDEN \| Usuario sem permissao para a acao" | N |
| TC73 | HU-05 | — | "401 \| UNAUTHENTICATED \| Requisicao sem sessao" | N |
| TC74 | HU-05 | CA-10 | "422 \| VALIDATION_ERROR \| Corpo ou query string invalidos" | N |
| TC75 | HU-05 | — | "404 \| DEMAND_NOT_FOUND \| Demanda inexistente" | N |
| TC76 | HU-05 | CA-10 | (transições permitidas não especificadas) | S |
| TC77 | HU-05 | CA-10 | (transição para cancelada não especificada) | S |
| TC78 | HU-04 | CA-10 | "O gestor deve conseguir atualizar status e observação da demanda." | N |
| TC79 | HU-05 | CA-10 | "registrar observações na demanda para manter o histórico do atendimento rastreável" | N |
| TC80 | HU-07 | CA-09 | "O painel do gestor deve apresentar métricas, fila recente e triagem inteligente." | N |
| TC81 | HU-07 | CA-09 | "fila recente" (critério de ordenação não definido) | S |
| TC82 | HU-08 | CA-09 | "revisar a triagem automática para validar categoria, confiança e sugestão de encaminhamento" | N |
| TC83 | HU-08 | — | (regra categoria→órgão não descrita; só o exemplo categoriasJson) | S |
| TC84 | HU-10 | CA-08 | "Cidadao recebe metricas das proprias demandas." | N |
| TC85 | HU-07 | CA-09 | "Gestor recebe metricas gerais." | N |
| TC86 | HU-07 | — | "REDIS_URL \| vazio \| Redis opcional para cache" | N |
| TC87 | HU-07 | — | (Redis configurado e indisponível não descrito) | S |
| TC88 | HU-10 | CA-08 | "O dashboard do cidadão deve apresentar resumo das solicitações." | N |
| TC89 | HU-02 | CA-01 | "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." | N |
| TC90 | HU-01 | CA-01 | "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." | N |
| TC91 | HU-06 | CA-01 | "O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas." | N |
| TC92 | HU-03 | CA-12 | "A interface deve ser utilizável em mobile, tablet e desktop." (critério "utilizável" definido por suposição) | S |
| TC93 | HU-03 | CA-12 | "A interface deve ser utilizável em mobile, tablet e desktop." (critério "utilizável" definido por suposição) | S |
| TC94 | HU-03 | CA-12 | "A interface deve ser utilizável em mobile, tablet e desktop." (critério "utilizável" definido por suposição) | S |

### 4.6 Casos de teste

Os 94 casos, nos 8 campos pedidos, estão em [`casos-de-teste.md`](casos-de-teste.md). A saída íntegra da IA está em [`ia/saida-rodada-2.md`](ia/saida-rodada-2.md).

## 5. Seleção para automação

*Cinco medidas por caso, e só então a escolha entre execução manual e automatizada.*

```
execuções até o retorno = Ti ÷ (Tm − Ta − Mn/F)
```

- **Tm** é o tempo de uma execução manual honesta, cronometrada uma vez, não estimada de cabeça.

- **Ti** é o investimento único; **Mn** é o que a automação consome por mês só para continuar funcionando.

- **F** é a frequência realista no horizonte do projeto, não a frequência ideal.

- "Não automatizar" nunca significa "não verificar": o caso continua no plano, com execução manual e responsável.

**Premissas.** Horizonte do projeto: 3 meses (outubro a dezembro de 2026). F conta execuções realistas: casos de API e de componente rodam no CI a cada push (20 por mês); fluxos de sistema críticos rodam antes de cada merge na main (8 por mês); os demais, uma vez por semana (4 por mês). Um caso é automatizado quando as execuções até o retorno cabem no horizonte (≤ 3 × F). Quando Tm − Ta − Mn/F ≤ 0, a automação não se paga em nenhum número de execuções.

| ID | Nível | Tm manual/exec | Ti implementar | Ta auto/exec | Mn manut./mês | F exec./mês | Execuções até o retorno | Automatizar? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC01 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC02 | Integração de componentes | 3 min | 15 min | 1 s | 3 min | 20 | 5,3 | Sim |
| TC03 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC04 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC05 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC06 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC07 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC08 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC09 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC10 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC11 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC12 | Sistema | 4 min | 45 min | 15 s | 10 min | 8 | 18,0 | Sim |
| TC13 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC14 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC15 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC16 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC17 | Integração de componentes | 3 min | 15 min | 1 s | 3 min | 20 | 5,3 | Sim |
| TC18 | Sistema | 3 min | 20 min | 10 s | 10 min | 8 | 12,6 | Sim |
| TC19 | Sistema | 3 min | 20 min | 10 s | 10 min | 8 | 12,6 | Sim |
| TC20 | Componente | 10 min | 10 min | 1 s | 3 min | 20 | 1,0 | Sim |
| TC21 | Componente | 8 min | 10 min | 1 s | 3 min | 20 | 1,3 | Sim |
| TC22 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC23 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC24 | Integração de componentes | 5 min | 40 min | 1 s | 5 min | 20 | 8,5 | Sim |
| TC25 | Integração de componentes | 4 min | 20 min | 1 s | 3 min | 20 | 5,2 | Sim |
| TC26 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC27 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC28 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC29 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC30 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC31 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC32 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC33 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC34 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC35 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC36 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC37 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC38 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC39 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC40 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC41 | Sistema | 6 min | 30 min | 25 s | 15 min | 8 | 8,1 | Sim |
| TC42 | Sistema | 3 min | 45 min | 15 s | 10 min | 8 | 30,0 | Não, permanece manual |
| TC43 | Sistema | 3 min | 45 min | 15 s | 10 min | 8 | 30,0 | Não, permanece manual |
| TC44 | Componente | 4 min | 45 min | 1 s | 5 min | 20 | 12,1 | Sim |
| TC45 | Sistema | 5 min | 90 min | 30 s | 20 min | 8 | 45,0 | Não, permanece manual |
| TC46 | Integração de componentes | 4 min | 25 min | 1 s | 3 min | 20 | 6,5 | Sim |
| TC47 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC48 | Integração de componentes | 3 min | 20 min | 1 s | 3 min | 20 | 7,1 | Sim |
| TC49 | Integração de componentes | 8 min | 30 min | 1 s | 5 min | 20 | 3,9 | Sim |
| TC50 | Integração de componentes | 12 min | 60 min | 1 s | 10 min | 20 | 5,2 | Sim |
| TC51 | Sistema | 8 min | 120 min | 30 s | 20 min | 4 | 48,0 | Não, permanece manual |
| TC52 | Integração de componentes | 5 min | 10 min | 1 s | 3 min | 20 | 2,1 | Sim |
| TC53 | Integração de componentes | 5 min | 10 min | 1 s | 3 min | 20 | 2,1 | Sim |
| TC54 | Integração de componentes | 8 min | 45 min | 1 s | 5 min | 20 | 5,8 | Sim |
| TC55 | Integração de componentes | 4 min | 10 min | 1 s | 3 min | 20 | 2,6 | Sim |
| TC56 | Integração de componentes | 4 min | 10 min | 1 s | 3 min | 20 | 2,6 | Sim |
| TC57 | Integração de componentes | 4 min | 20 min | 1 s | 3 min | 20 | 5,2 | Sim |
| TC58 | Integração de componentes | 4 min | 20 min | 1 s | 3 min | 20 | 5,2 | Sim |
| TC59 | Integração de componentes | 4 min | 10 min | 1 s | 3 min | 20 | 2,6 | Sim |
| TC60 | Integração de componentes | 4 min | 20 min | 1 s | 3 min | 20 | 5,2 | Sim |
| TC61 | Integração de componentes | 3 min | 15 min | 1 s | 3 min | 20 | 5,3 | Sim |
| TC62 | Sistema | 4 min | 20 min | 20 s | 10 min | 8 | 8,3 | Sim |
| TC63 | Sistema | 3 min | 45 min | 15 s | 10 min | 4 | 180,0 | Não, permanece manual |
| TC64 | Sistema | 4 min | 60 min | 15 s | 10 min | 4 | 48,0 | Não, permanece manual |
| TC65 | Componente | 5 min | 30 min | 1 s | 5 min | 20 | 6,3 | Sim |
| TC66 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC67 | Integração de componentes | 5 min | 10 min | 1 s | 3 min | 20 | 2,1 | Sim |
| TC68 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC69 | Sistema | 3 min | 40 min | 15 s | 10 min | 8 | 26,7 | Não, permanece manual |
| TC70 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC71 | Integração de componentes | 5 min | 10 min | 1 s | 3 min | 20 | 2,1 | Sim |
| TC72 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC73 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC74 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC75 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC76 | Integração de componentes | 10 min | 40 min | 1 s | 5 min | 20 | 4,1 | Sim |
| TC77 | Integração de componentes | 5 min | 25 min | 1 s | 3 min | 20 | 5,2 | Sim |
| TC78 | Sistema | 8 min | 90 min | 40 s | 20 min | 8 | 18,6 | Sim |
| TC79 | Sistema | 6 min | 60 min | 30 s | 15 min | 8 | 16,6 | Sim |
| TC80 | Sistema | 3 min | 45 min | 15 s | 10 min | 4 | 180,0 | Não, permanece manual |
| TC81 | Sistema | 4 min | 45 min | 20 s | 15 min | 4 | não se paga | Não, permanece manual |
| TC82 | Sistema | 5 min | 20 min | 25 s | 15 min | 8 | 7,4 | Sim |
| TC83 | Integração de componentes | 5 min | 30 min | 1 s | 5 min | 20 | 6,3 | Sim |
| TC84 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC85 | Integração de componentes | 3 min | 10 min | 1 s | 3 min | 20 | 3,5 | Sim |
| TC86 | Integração de componentes | 6 min | 20 min | 1 s | 3 min | 20 | 3,4 | Sim |
| TC87 | Integração de componentes | 15 min | 60 min | 1 s | 10 min | 20 | 4,1 | Sim |
| TC88 | Sistema | 3 min | 45 min | 15 s | 10 min | 4 | 180,0 | Não, permanece manual |
| TC89 | Sistema | 1 min | 20 min | 5 s | 5 min | 4 | não se paga | Não, permanece manual |
| TC90 | Sistema | 1 min | 20 min | 5 s | 5 min | 4 | não se paga | Não, permanece manual |
| TC91 | Sistema | 1 min | 20 min | 5 s | 5 min | 4 | não se paga | Não, permanece manual |
| TC92 | Sistema | 10 min | 30 min | 40 s | 15 min | 4 | 5,4 | Sim |
| TC93 | Sistema | 10 min | 30 min | 40 s | 15 min | 4 | 5,4 | Sim |
| TC94 | Sistema | 10 min | 30 min | 40 s | 15 min | 4 | 5,4 | Sim |

## 6. Backlog de automação

*Entre os casos selecionados para automação, qual vem primeiro.*

> **Atividade:** ordenar o backlog de automação.

**Três fatores a considerar**

- **Risco:** o que acontece se este comportamento quebrar em produção e ninguém perceber?

- **Custo:** quanto custa implementar e manter este caso automatizado?

- **Frequência:** quantas vezes este caso será executado no horizonte do projeto?

```
prioridade = (Risco × Frequência) ÷ Custo
```

*Escalas de 1 a 3. Heurística de ordenação.*

*Uma linha por caso selecionado para automação.*

**Critérios das escalas.** Risco 3 = autenticação, controle de acesso, criação da demanda, mudança de status ou fallback do Vision (quebra silenciosa expõe dados ou impede o fluxo principal); 2 = validação, filtros, métricas e exibição; 1 = valores padrão, navegação e layout. Custo 1 = Ti ≤ 20 min e Mn ≤ 5 min/mês; 3 = Ti ≥ 90 min ou Mn ≥ 20 min/mês; 2 = o restante. Frequência 3 = a cada push (20/mês); 2 = antes de cada merge (8/mês); 1 = semanal (4/mês). Empates são ordenados por maior risco e menor custo. Status "Existe" indica teste já presente no repositório (CT-\* em tests/acceptance, testes unitários em tests/unit ou spec em e2e/), que precisa ter o oráculo revisado contra a matriz 4.5. "Bloqueado" indica caso que depende de decisão de produto sobre a lacuna indicada.

| Ordem | ID do caso | HU | Nível | Risco | Custo | Frequência | Prioridade | Responsável | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TC01 | HU-01 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-01) |
| 2 | TC03 | HU-01 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | A fazer |
| 3 | TC04 | HU-01 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | A fazer |
| 4 | TC13 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-04) |
| 5 | TC14 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-05) |
| 6 | TC15 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-06) |
| 7 | TC16 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-07) |
| 8 | TC20 | HU-02 | Componente | 3 | 1 | 3 | 9,0 | Diego David | Existe (teste unitário de session) |
| 9 | TC21 | HU-02 | Componente | 3 | 1 | 3 | 9,0 | Diego David | Existe (teste unitário de api) |
| 10 | TC22 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-09) |
| 11 | TC23 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-10) |
| 12 | TC25 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | A fazer |
| 13 | TC26 | HU-02 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-AUTH-11) |
| 14 | TC28 | HU-03 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | Existe (CT-DEM-01) |
| 15 | TC29 | HU-03 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | A fazer |
| 16 | TC40 | HU-03 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | Existe (CT-DEM-02) |
| 17 | TC48 | HU-12 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | A fazer |
| 18 | TC52 | HU-06 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | Existe (CT-DEM-07) |
| 19 | TC53 | HU-06 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | Existe (CT-DEM-08) |
| 20 | TC67 | HU-04 | Integração | 3 | 1 | 3 | 9,0 | Hyngrid Souza | Existe (CT-DEM-14) |
| 21 | TC70 | HU-05 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-DEM-18) |
| 22 | TC71 | HU-05 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-DEM-18) |
| 23 | TC72 | HU-05 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-DEM-17) |
| 24 | TC73 | HU-05 | Integração | 3 | 1 | 3 | 9,0 | Enzo Antuna | Existe (CT-DEM-21) |
| 25 | TC02 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 26 | TC05 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 27 | TC06 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 28 | TC07 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 29 | TC08 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 30 | TC09 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 31 | TC10 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 32 | TC11 | HU-01 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | Existe (CT-AUTH-02) |
| 33 | TC17 | HU-02 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | A fazer |
| 34 | TC33 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-03) |
| 35 | TC34 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 36 | TC35 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-04) |
| 37 | TC36 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 38 | TC37 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 39 | TC38 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-05) |
| 40 | TC39 | HU-03 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 41 | TC47 | HU-12 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 42 | TC55 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-09) |
| 43 | TC56 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-10) |
| 44 | TC57 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 45 | TC58 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 46 | TC59 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-11) |
| 47 | TC60 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 48 | TC61 | HU-06 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 49 | TC66 | HU-04 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-13) |
| 50 | TC68 | HU-04 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-DEM-16) |
| 51 | TC74 | HU-05 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | Existe (CT-DEM-19) |
| 52 | TC75 | HU-05 | Integração | 2 | 1 | 3 | 6,0 | Enzo Antuna | Existe (CT-DEM-20) |
| 53 | TC84 | HU-10 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-MET-02) |
| 54 | TC85 | HU-07 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | Existe (CT-MET-01) |
| 55 | TC86 | HU-07 | Integração | 2 | 1 | 3 | 6,0 | Hyngrid Souza | A fazer |
| 56 | TC24 | HU-02 | Integração | 3 | 2 | 3 | 4,5 | Enzo Antuna | A fazer |
| 57 | TC49 | HU-08 | Integração | 3 | 2 | 3 | 4,5 | Hyngrid Souza | A fazer |
| 58 | TC50 | HU-08 | Integração | 3 | 2 | 3 | 4,5 | Hyngrid Souza | A fazer |
| 59 | TC54 | HU-06 | Integração | 3 | 2 | 3 | 4,5 | Hyngrid Souza | Bloqueado (L09) |
| 60 | TC76 | HU-05 | Integração | 3 | 2 | 3 | 4,5 | Enzo Antuna | Bloqueado (L05) |
| 61 | TC77 | HU-05 | Integração | 3 | 2 | 3 | 4,5 | Enzo Antuna | Bloqueado (L05) |
| 62 | TC18 | HU-02 | Sistema | 3 | 2 | 2 | 3,0 | Diego David | A fazer |
| 63 | TC19 | HU-02 | Sistema | 3 | 2 | 2 | 3,0 | Diego David | A fazer |
| 64 | TC41 | HU-03 | Sistema | 3 | 2 | 2 | 3,0 | Diego David | Existe (registrar-demanda.spec) |
| 65 | TC44 | HU-03 | Componente | 2 | 2 | 3 | 3,0 | Diego David | A fazer |
| 66 | TC46 | HU-12 | Integração | 2 | 2 | 3 | 3,0 | Hyngrid Souza | A fazer |
| 67 | TC83 | HU-08 | Integração | 2 | 2 | 3 | 3,0 | Hyngrid Souza | A fazer |
| 68 | TC87 | HU-07 | Integração | 2 | 2 | 3 | 3,0 | Hyngrid Souza | Bloqueado (L14) |
| 69 | TC27 | — | Integração | 1 | 1 | 3 | 3,0 | Enzo Antuna | Existe (CT-GEN-03) |
| 70 | TC30 | HU-03 | Integração | 1 | 1 | 3 | 3,0 | Hyngrid Souza | A fazer |
| 71 | TC31 | HU-03 | Integração | 1 | 1 | 3 | 3,0 | Hyngrid Souza | A fazer |
| 72 | TC32 | HU-03 | Integração | 1 | 1 | 3 | 3,0 | Hyngrid Souza | A fazer |
| 73 | TC78 | HU-04 | Sistema | 3 | 3 | 2 | 2,0 | Diego David | A fazer |
| 74 | TC12 | HU-01 | Sistema | 2 | 2 | 2 | 2,0 | Diego David | A fazer |
| 75 | TC62 | HU-06 | Sistema | 2 | 2 | 2 | 2,0 | Diego David | Existe (buscar-demandas.spec) |
| 76 | TC79 | HU-05 | Sistema | 2 | 2 | 2 | 2,0 | Diego David | A fazer |
| 77 | TC82 | HU-08 | Sistema | 2 | 2 | 2 | 2,0 | Diego David | Existe (triagem-gestor.spec) |
| 78 | TC65 | HU-06 | Componente | 1 | 2 | 3 | 1,5 | Diego David | A fazer |
| 79 | TC92 | HU-03 | Sistema | 1 | 2 | 1 | 0,5 | Diego David | A fazer |
| 80 | TC93 | HU-03 | Sistema | 1 | 2 | 1 | 0,5 | Diego David | A fazer |
| 81 | TC94 | HU-03 | Sistema | 1 | 2 | 1 | 0,5 | Diego David | A fazer |

**Verificação**

- O primeiro item é de risco alto, custo baixo e frequência alta.
