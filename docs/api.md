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
