## Manutenção da TAS — ⚠️ pontos de atenção

Política: `docs/tas.md`. Erros falham o check; avisos viram issue na revisão periódica.


### Avisos (1)

- 25 teste(s) sem ID de caso de teste (TCxx) no nome — ver lista abaixo.


<details><summary>Testes sem TCxx no nome (25)</summary>

- unitarios: Session deve recuperar o token persistido no cold start
- unitarios: Session deve retornar null quando o storage está vazio ou corrompido
- unitarios: Session deve limpar o token no logout
- unitarios: API Service deve registrar um novo usuário com sucesso
- unitarios: API Service deve lançar um erro se o email já estiver registrado
- unitarios: API Service não deve enviar Authorization quando não há sessão
- unitarios: AuthService deve chamar o método login do API com email e senha corretos
- unitarios: AuthService deve lançar um erro se as credenciais forem inválidas
- api: Login com credenciais válidas
- api: Login com credenciais inválidas
- api: SUT API Tests - Módulo de Demandas (/api/demands) POST /api/demands - Criação de Demandas CT-DEM-06: Deve rejeitar criação sem objeto de endereço obrigatório e retornar status 422
- api: SUT API Tests - Módulo de Demandas (/api/demands) GET /api/demands - Listagem e Filtros com Regras de Perfil CT-DEM-12: Deve rejeitar listagem sem token e retornar status 401
- api: SUT API Tests - Módulo de Demandas (/api/demands) GET /api/demands/:id - Detalhes e Proteção de Acesso (IDOR) CT-DEM-15: Gestor público deve conseguir visualizar demanda de qualquer cidadão
- api: SUT API Tests - Módulo de Autenticação (/api/auth) POST /api/auth/register - Cadastro de Usuários CT-AUTH-03: Deve rejeitar payload com campos inválidos ou ausentes e retornar status 422
- api: SUT API Tests - Módulo de Autenticação (/api/auth) GET /api/auth/me - Perfil do Usuário Autenticado CT-AUTH-08: Deve retornar os dados do perfil quando fornecido Bearer Token válido
- api: SUT API Tests - Módulo de Autenticação (/api/auth) POST /api/auth/logout - Encerramento de Sessão CT-AUTH-11: Deve permitir logout com sucesso e limpar cookies de sessão
- api: SUT API Tests - Métricas e Catálogo de Órgãos GET /api/metrics/summary - Consolidação de Indicadores CT-MET-03: Deve rejeitar consulta de métricas sem token com status 401
- api: SUT API Tests - Métricas e Catálogo de Órgãos GET /api/organs - Catálogo de Órgãos Responsáveis CT-ORG-01: Usuário autenticado deve listar órgãos municipais ordenados por nome com status 200
- api: SUT API Tests - Métricas e Catálogo de Órgãos GET /api/organs - Catálogo de Órgãos Responsáveis CT-ORG-02: Deve rejeitar listagem de órgãos sem autenticação com status 401
- api: SUT API Tests - Infraestrutura, Healthcheck e Roteamento Geral GET /api - Catálogo e Metadados da API CT-GEN-01: Deve responder com metadados do sistema e catálogo de endpoints públicos com status 200
- api: SUT API Tests - Infraestrutura, Healthcheck e Roteamento Geral GET /api/health - Monitoramento de Liveness CT-GEN-02: Deve retornar status 200 com payload confirmando saúde do serviço
- api: SUT API Tests - Infraestrutura, Healthcheck e Roteamento Geral GET / - Redirecionamento Inicial CT-GEN-04: Deve redirecionar requisições na raiz para /api com status 302
- api: Auth Routes - Login deve retornar sucesso para credenciais válidas
- api: Auth Routes - Login deve retornar erro para credenciais inválidas
- api: Auth Routes - Register deve registrar um novo usuário com sucesso

</details>
