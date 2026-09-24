Você é analista de testes. Vai derivar casos de teste para o Urbanize a partir dos quatro insumos abaixo.
Use SOMENTE os insumos. Onde faltar informação, NÃO invente: marque como SUPOSIÇÃO e registre a lacuna.

# INSUMO 1 — Requisitos

## 1.1 Histórias de usuário (na íntegra)

HU-01: Como cidadão, quero cadastrar minha conta no Urbanize para acessar o sistema e registrar demandas urbanas com meu perfil de usuário.
HU-02: Como cidadão ou gestor, quero fazer login na plataforma para acessar as funcionalidades correspondentes ao meu perfil.
HU-03: Como cidadão, quero registrar uma nova demanda informando foto, título, descrição, prioridade e localização para comunicar problemas urbanos à gestão pública de forma organizada.
HU-04: Como cidadão, quero acompanhar o status e o histórico de uma demanda para saber como minha solicitação está evoluindo.
HU-05: Como gestor, quero atualizar o status e registrar observações na demanda para manter o histórico do atendimento rastreável.
HU-06: Como cidadão ou gestor, quero visualizar e filtrar demandas cadastradas para encontrar rapidamente solicitações específicas.
HU-07: Como gestor, quero acessar um painel com métricas e fila recente para monitorar e priorizar demandas urbanas.
HU-08: Como gestor, quero revisar a triagem automática para validar categoria, confiança e sugestão de encaminhamento.
HU-09: Como gestor, quero aceitar a sugestão de encaminhamento para direcionar a demanda ao órgão adequado.
HU-10: Como cidadão, quero consultar um dashboard resumido para acompanhar indicadores das minhas solicitações.
HU-11: Como cidadão, quero receber notificações por e-mail ou SMS sempre que o status da minha demanda for atualizado para me manter informado sem precisar acessar o sistema.
HU-12: Como cidadão, quero anexar fotos ao registrar uma demanda para evidenciar visualmente o problema urbano relatado.
HU-13: Como cidadão, quero visualizar a localização da minha demanda em um mapa interativo para identificar geograficamente onde o problema está ocorrendo.

## 1.2 Critérios de aceite (na íntegra)

CA-01: O usuário deve conseguir acessar a home e navegar para login, cadastro e demandas.
CA-02: O login deve permitir entrada com perfis de cidadão e gestor.
CA-03: O cadastro deve aceitar dados válidos, perfil e criar usuário no backend.
CA-04: O formulário de nova demanda deve permitir upload de foto, preencher título/descrição pela triagem e exigir localização e aceite de compartilhamento de dados.
CA-05: Ao registrar uma demanda, o sistema deve gerar protocolo e abrir a tela de detalhe.
CA-06: A listagem deve exibir demandas e aplicar filtros corretamente.
CA-07: A página de detalhe deve exibir protocolo, descrição, localização, prioridade, status e histórico.
CA-08: O dashboard do cidadão deve apresentar resumo das solicitações.
CA-09: O painel do gestor deve apresentar métricas, fila recente e triagem inteligente.
CA-10: O gestor deve conseguir atualizar status e observação da demanda.
CA-11: O sistema deve exibir estados adequados de carregamento, erro e vazio.
CA-12: A interface deve ser utilizável em mobile, tablet e desktop.
CA-13: Nenhum defeito crítico deve permanecer aberto antes da entrega.

Observação: os critérios de aceite não estão vinculados a uma HU específica. Ao usar um CA, indique a qual HU você o vinculou.

## 1.3 Documento de contratos de endpoints (na íntegra)

# Documentacao da API Urbanize

API REST do backend Express do Urbanize para autenticacao, gestao de demandas urbanas, upload de imagens, orgaos responsaveis e metricas.

## Base URL

Ambiente local:

```text
http://127.0.0.1:4000/api
```

O frontend usa `NEXT_PUBLIC_API_URL` e, por padrao, aponta para `http://127.0.0.1:4000/api`.

## Autenticacao

A API aceita autenticacao de duas formas:

- Cookie HTTP-only `urbanize_session`, criado automaticamente nos endpoints de login e cadastro.
- Header `Authorization: Bearer <token>`.

Endpoints protegidos exigem uma dessas credenciais validas.

## Formato das respostas

Resposta de sucesso:

```json
{
  "success": true,
  "data": {}
}
```

Resposta de erro:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos.",
    "details": []
  }
}
```

Codigos comuns:

| HTTP | Code | Quando ocorre |
| --- | --- | --- |
| 400 | `NO_FILE` | Upload sem arquivo |
| 401 | `UNAUTHENTICATED` | Requisicao sem sessao |
| 401 | `INVALID_CREDENTIALS` | Email ou senha invalidos |
| 401 | `INVALID_TOKEN` | Token invalido ou expirado |
| 403 | `FORBIDDEN` | Usuario sem permissao para a acao |
| 404 | `NOT_FOUND` | Rota inexistente |
| 404 | `DEMAND_NOT_FOUND` | Demanda inexistente |
| 409 | `EMAIL_ALREADY_EXISTS` | Email ja cadastrado |
| 422 | `VALIDATION_ERROR` | Corpo ou query string invalidos |
| 500 | `INTERNAL_ERROR` | Erro inesperado no servidor |

## Enums

`UserRole`:

```text
cidadao, gestor
```

`DemandStatus`:

```text
registrada, em_analise, encaminhada, em_atendimento, resolvida, cancelada
```

`DemandCategory`:

```text
vias_publicas, iluminacao_publica, coleta_de_lixo, saneamento, fiscalizacao, zeladoria, outros
```

`DemandPriority`:

```text
baixa, media, alta
```

`DemandSource`:

```text
cidadao, sistema_externo, orgao
```

## Permissoes

- Cidadao: cria demandas, lista apenas suas demandas, consulta detalhes das proprias demandas e consulta metricas pessoais.
- Gestor: lista demandas do seu orgao quando possui vinculo; se estiver sem orgao, lista a fila geral. Pode alterar status e consultar metricas gerais.

## Endpoints

### GET `/health`

Verifica se a API esta ativa.

Resposta:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

### POST `/auth/register`

Cadastra usuario e inicia sessao.

Autenticacao: publica.

Body:

```json
{
  "nome": "Maria Silva",
  "email": "maria@urbanize.com",
  "senha": "demo",
  "telefone": "(81) 99999-9999",
  "role": "cidadao"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| `nome` | string | sim | Minimo 2 caracteres |
| `email` | string | sim | Email valido e unico |
| `senha` | string | sim | Minimo 1 caractere |
| `telefone` | string | nao | Telefone do usuario |
| `role` | `UserRole` | nao | Padrao: `cidadao` |

Resposta `201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "nome": "Maria Silva",
      "email": "maria@urbanize.com",
      "telefone": "(81) 99999-9999",
      "role": "cidadao"
    },
    "token": "jwt..."
  }
}
```

### POST `/auth/login`

Autentica usuario.

Autenticacao: publica.

Body:

```json
{
  "email": "cidadao@urbanize.com",
  "senha": "demo"
}
```

Resposta:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "nome": "Cidadao Urbanize",
      "email": "cidadao@urbanize.com",
      "role": "cidadao"
    },
    "token": "jwt..."
  }
}
```

### GET `/auth/me`

Retorna o usuario autenticado.

Autenticacao: obrigatoria.

Resposta:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "nome": "Cidadao Urbanize",
      "email": "cidadao@urbanize.com",
      "role": "cidadao"
    }
  }
}
```

### POST `/auth/logout`

Remove o cookie de sessao.

Autenticacao: publica.

Resposta:

```json
{
  "success": true,
  "data": null
}
```

### GET `/demands`

Lista demandas visiveis para o usuario autenticado.

Autenticacao: obrigatoria.

Query params opcionais:

| Parametro | Tipo |
| --- | --- |
| `status` | `DemandStatus` |
| `categoria` | `DemandCategory` |
| `prioridade` | `DemandPriority` |
| `bairro` | string |
| `busca` | string |

Exemplo:

```bash
curl "http://127.0.0.1:4000/api/demands?status=em_analise&categoria=vias_publicas" \
  -H "Authorization: Bearer <token>"
```

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "protocolo": "URB-12345",
      "titulo": "Buraco na rua",
      "descricao": "Buraco grande proximo ao cruzamento.",
      "categoria": "vias_publicas",
      "prioridade": "media",
      "status": "em_analise",
      "nomeSolicitante": "Maria Silva",
      "emailSolicitante": "maria@urbanize.com",
      "telefoneSolicitante": "(81) 99999-9999",
      "endereco": {
        "endereco": "Rua Exemplo, 100",
        "bairro": "Boa Vista",
        "cidade": "Recife",
        "referencia": "Perto da escola"
      },
      "origem": "cidadao",
      "imagemUrl": "/uploads/imagem.webp",
      "scoreTriagem": 0.82,
      "sugestaoEncaminhamento": "Secretaria de Obras",
      "criadaEm": "2026-06-17T12:00:00.000Z",
      "atualizadaEm": "2026-06-17T12:00:00.000Z",
      "historico": []
    }
  ]
}
```

### POST `/demands`

Cria uma demanda urbana.

Autenticacao: obrigatoria.

Body:

```json
{
  "titulo": "Buraco na rua",
  "descricao": "Buraco grande causando risco para motos.",
  "categoria": "vias_publicas",
  "prioridade": "alta",
  "nomeSolicitante": "Maria Silva",
  "emailSolicitante": "maria@urbanize.com",
  "telefoneSolicitante": "(81) 99999-9999",
  "endereco": {
    "endereco": "Rua Exemplo, 100",
    "bairro": "Boa Vista",
    "cidade": "Recife",
    "referencia": "Perto da escola",
    "latitude": -8.0476,
    "longitude": -34.877
  },
  "origem": "cidadao",
  "imagemUrl": "/uploads/arquivo.webp"
}
```

Campos obrigatorios:

| Campo | Regra |
| --- | --- |
| `titulo` | string com minimo 3 caracteres |
| `descricao` | string com minimo 5 caracteres |
| `categoria` | `DemandCategory` |
| `endereco.endereco` | string com minimo 3 caracteres |

Campos opcionais:

| Campo | Padrao |
| --- | --- |
| `prioridade` | `media` |
| `nomeSolicitante` | Nome do usuario autenticado |
| `emailSolicitante` | Email do usuario autenticado |
| `telefoneSolicitante` | vazio |
| `endereco.bairro` | `Nao informado` |
| `endereco.cidade` | `Recife` |
| `origem` | `cidadao` |
| `imagemUrl` | vazio |

Resposta `201`: objeto de demanda no mesmo formato de `GET /demands`.

### GET `/demands/:id`

Busca uma demanda por ID.

Autenticacao: obrigatoria.

Regras:

- Cidadao so acessa demandas que criou.
- Gestor acessa demandas permitidas para o perfil.

Resposta: objeto de demanda.

### PATCH `/demands/:id/status`

Atualiza o status de uma demanda.

Autenticacao: obrigatoria.

Permissao: somente `gestor`.

Body:

```json
{
  "status": "em_atendimento",
  "observacaoGestor": "Equipe acionada para vistoria."
}
```

Resposta: objeto de demanda atualizado, com novo item no historico.

### POST `/upload/image`

Envia imagem para triagem.

Autenticacao: obrigatoria.

Content-Type: `multipart/form-data`

Campos:

| Campo | Tipo | Obrigatorio | Observacao |
| --- | --- | --- | --- |
| `imagem` | file | sim | Arquivo processado pelo Multer |
| `categoria` | `DemandCategory` | nao | Categoria sugerida pelo frontend como fallback |

Exemplo:

```bash
curl -X POST "http://127.0.0.1:4000/api/upload/image" \
  -H "Authorization: Bearer <token>" \
  -F "imagem=@foto.jpg" \
  -F "categoria=vias_publicas"
```

Resposta:

```json
{
  "success": true,
  "data": {
    "imageUrl": "/uploads/1781180873896-762490.jpg",
    "triagem": {
      "categoria": "vias_publicas",
      "prioridade": "media",
      "score": 0.82,
      "tituloSugerido": "Buraco na rua",
      "descricaoSugerida": "Imagem analisada automaticamente."
    }
  }
}
```

Observacao: o formato interno de `triagem` depende do servico de visao configurado. Quando Google Vision nao estiver configurado, a API usa a categoria enviada pelo frontend como fallback.

### GET `/organs`

Lista orgaos responsaveis cadastrados.

Autenticacao: obrigatoria.

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "nome": "Secretaria de Obras",
      "sigla": "SEOB",
      "email": "obras@example.com",
      "telefone": "(81) 3333-3333",
      "whatsapp": "5581999999999",
      "site": "https://example.com",
      "categoriasJson": "[\"vias_publicas\"]"
    }
  ]
}
```

### GET `/metrics/summary`

Retorna metricas resumidas.

Autenticacao: obrigatoria.

Regras:

- Cidadao recebe metricas das proprias demandas.
- Gestor recebe metricas gerais.

Resposta:

```json
{
  "success": true,
  "data": {
    "total": 10,
    "porStatus": {
      "em_analise": 4,
      "resolvida": 6
    },
    "porCategoria": {
      "vias_publicas": 5,
      "coleta_de_lixo": 5
    },
    "tempoMedioAtendimentoDias": 2.4
  }
}
```

## Como executar localmente

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Credenciais de demonstracao apos seed:

```text
cidadao@urbanize.com / demo
gestor@urbanize.com / demo
```

## Variaveis de ambiente do backend

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `BACKEND_PORT` ou `PORT` | `4000` | Porta da API |
| `FRONTEND_URL` | `http://127.0.0.1:4100` | Origem liberada no CORS |
| `JWT_SECRET` | `urbanize-dev-secret-change-me` | Chave para assinar JWT |
| `JWT_EXPIRES_IN` | `7d` | Duracao do token |
| `AUTH_COOKIE_NAME` | `urbanize_session` | Nome do cookie de sessao |
| `REDIS_URL` | vazio | Redis opcional para cache |
| `METRICS_CRON` | `*/15 * * * *` | Agendamento do snapshot de metricas |
| `GOOGLE_VISION_CREDENTIALS` | vazio | Credenciais opcionais do Google Vision |

# INSUMO 2 — Formato esperado

Cada caso com exatamente estes 8 campos, nesta ordem. Formato pedido é formato entregue.
- ID: identificador único e sequencial (TC01, TC02...), nunca reutilizado.
- HU: história de usuário de origem (ex.: HU-05 Atualização de status).
- CA: critério de aceite específico que o caso verifica, citado literalmente. Se não houver, escreva "SUPOSIÇÃO".
- Título: o que o caso verifica, em uma frase iniciada por verbo.
- Pré-condições: estado do sistema, massa de dados e perfil necessários antes do passo 1.
- Passos: ações numeradas, sem interpretação.
- Resultado esperado: um único comportamento observável e verificável.
- Pós-condições: estado em que o sistema deve ficar depois, inclusive quando a ação é recusada.
Se um caso tiver mais de um resultado esperado, divida em casos separados. Não acrescente outros campos.

# INSUMO 3 — Escopo

## Dentro do escopo
| Item | Motivo |
| --- | --- |
| Cadastro e login com JWT (cidadão e gestor) | Porta de entrada de todos os fluxos; define o perfil |
| Registro de demanda com categoria, descrição, foto e localização | Fluxo principal do produto; concentra a regra de negócio |
| Listagem com filtros e detalhe com histórico | Fluxo principal do cidadão |
| Fila do gestor: alterar status, observação, revisar triagem | Fluxo principal do gestor; fecha o ciclo da demanda |
| Controle de acesso por perfil | Regra que protege os fluxos |
| Validação de entrada e códigos de erro da API | Contrato que sustenta o app |
| Fallback para categoria manual quando o Google Vision falha | Comportamento do produto na fronteira com a dependência externa |
| Métricas com Redis indisponível | Redis é opcional por design |
| Sugestão de órgão a partir da categoria | Regra interna, determinística |
| Estados de carregamento, erro e vazio | Comportamento visível quando rede ou backend falham |

## Fora do escopo — NÃO gere casos para estes itens
| Item | Motivo |
| --- | --- |
| Acurácia da classificação do Google Vision | Terceiro, não determinístico, fora do controle da squad |
| Disponibilidade e latência do Google Vision | SLA do fornecedor; só a reação do app à falha é testada |
| Câmera, galeria e precisão do GPS do aparelho | Recurso físico do dispositivo |
| Execução física do reparo pela prefeitura | Processo externo ao sistema |
| Matriz de aparelhos e versões de Android/iOS | Custa mais do que devolve no prazo |
| Testes de carga e desempenho | Custa mais do que devolve no prazo; sem meta de volume |
| Notificações por e-mail/SMS/push (HU-11) | Won't have; não implementado |
| Mapa interativo (HU-13) | Won't have; não implementado |

# INSUMO 4 — Níveis de teste

| Nível | Coberto? | Justificativa |
| --- | --- | --- |
| Componente | Sim | Serviços do app (api, authService, session) e hooks com regra própria; Jest com HTTP mockado |
| Integração de componentes | Sim | Contrato entre rotas Express, Prisma e banco; Jest + Supertest direto na API |
| Sistema | Sim | Fluxos ponta a ponta app + API + banco; Playwright no Expo web |
| Integração de sistemas | Não | Google Vision é terceiro não determinístico; só o fallback é verificado |
| Aceite | Não | Sem usuário real disponível no prazo |

# PEDIDOS (nesta ordem)

1. ANTES de gerar casos: liste as lacunas e ambiguidades dos requisitos (regra sem valor definido, critério que não dá para testar, transição de status não especificada, permissão não declarada, divergência entre HU/CA e o contrato de endpoints).
2. Monte a MATRIZ DE ALOCAÇÃO: condição de teste | nível responsável | justificativa. Use só os níveis cobertos.
3. Monte a TABELA DE DERIVAÇÃO: uma linha por regra | técnica de modelagem (partição de equivalência, valor limite, tabela de decisão, transição de estados) | condições derivadas | casos resultantes.
4. Gere os CASOS no formato do Insumo 2, indicando o nível de cada caso.
5. Monte a MATRIZ DE RASTREABILIDADE: caso | HU | CA | trecho literal do requisito ou do contrato | Suposição? (S/N). Sem trecho literal que sustente o caso, marque S.
