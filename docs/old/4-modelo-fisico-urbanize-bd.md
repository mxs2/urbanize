# Urbanize — Modelo Físico do Banco de Dados (PostgreSQL)

## 1. Visão Geral

Este documento traduz o Modelo Lógico em **DDL executável para PostgreSQL**, pronto para ser aplicado via `psql`, migração do Prisma ou script de inicialização. A estrutura está em **Terceira Forma Normal (3FN)**:

- **1FN**: todos os atributos são atômicos (sem listas/repetições em colunas — exceto `JSONB`, que é usado deliberadamente para dados intrinsecamente semiestruturados, como labels da IA).
- **2FN**: não há dependências parciais — todas as tabelas usam chave primária única (`UUID`), eliminando dependências de chaves compostas.
- **3FN**: não há dependências transitivas — atributos como nome da categoria, nome do órgão e dados de endereço estão isolados em tabelas próprias (`categorias_problema`, `orgaos_responsaveis`, `enderecos`), evitando redundância em `demandas`.

---

## 2. Extensões e Configurações Iniciais

```sql
-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensão para suporte geoespacial (consultas de proximidade, regiões)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Extensão para busca textual otimizada (ex.: busca em titulo/descricao das demandas)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuração de timezone padrão (alinhado a Recife/PE)
SET timezone = 'America/Recife';
```

> **Nota sobre PostGIS**: a extensão é opcional na fase inicial (latitude/longitude como `DECIMAL` já cobre o MVP). Recomenda-se habilitá-la quando consultas de proximidade ("demandas em um raio de X km") se tornarem necessárias — ver seção 10 (Próximas Etapas).

---

## 3. Tipos Enumerados (ENUMs)

```sql
CREATE TYPE papel_usuario AS ENUM ('cidadao', 'gestor', 'administrador');

CREATE TYPE nivel_acesso_admin AS ENUM ('padrao', 'master');

CREATE TYPE status_demanda AS ENUM (
    'registrada',
    'em_triagem',
    'em_analise',
    'encaminhada',
    'em_andamento',
    'resolvida',
    'rejeitada'
);

CREATE TYPE prioridade_demanda AS ENUM ('baixa', 'media', 'alta', 'urgente');

CREATE TYPE status_revisao_triagem AS ENUM ('pendente', 'aceita', 'corrigida', 'rejeitada');
```

---

## 4. Função Utilitária para `updated_at`

Função genérica reutilizada por triggers de várias tabelas para manter `updated_at` sempre atualizado.

```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Criação das Tabelas (DDL)

### 5.1 `usuarios`

```sql
CREATE TABLE usuarios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    telefone    VARCHAR(20),
    papel       papel_usuario NOT NULL,
    ativo       BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuarios_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
```

---

### 5.2 `enderecos`

```sql
CREATE TABLE enderecos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logradouro        VARCHAR(200) NOT NULL,
    numero            VARCHAR(10),
    bairro            VARCHAR(100) NOT NULL,
    cidade            VARCHAR(100) NOT NULL DEFAULT 'Recife',
    estado            CHAR(2) NOT NULL DEFAULT 'PE',
    cep               VARCHAR(9),
    latitude          DECIMAL(9,6),
    longitude         DECIMAL(9,6),
    ponto_referencia  VARCHAR(200),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_enderecos_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_enderecos_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_enderecos_cep_formato CHECK (cep IS NULL OR cep ~ '^\d{5}-?\d{3}$')
);
```

---

### 5.3 `categorias_problema`

```sql
CREATE TABLE categorias_problema (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(80) NOT NULL,
    descricao   TEXT,
    icone       VARCHAR(50),
    ativo       BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_categorias_nome UNIQUE (nome)
);
```

---

### 5.4 `orgaos_responsaveis`

```sql
CREATE TABLE orgaos_responsaveis (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome               VARCHAR(150) NOT NULL,
    descricao          TEXT,
    email_contato      VARCHAR(150),
    telefone_contato   VARCHAR(20),
    ativo              BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT uq_orgaos_nome UNIQUE (nome),
    CONSTRAINT chk_orgaos_email_formato CHECK (
        email_contato IS NULL OR email_contato ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);
```

---

### 5.5 `cidadaos`

```sql
CREATE TABLE cidadaos (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id           UUID NOT NULL,
    cpf                  VARCHAR(11) NOT NULL,
    endereco_padrao_id   UUID,

    CONSTRAINT uq_cidadaos_usuario UNIQUE (usuario_id),
    CONSTRAINT uq_cidadaos_cpf UNIQUE (cpf),
    CONSTRAINT chk_cidadaos_cpf_formato CHECK (cpf ~ '^\d{11}$'),

    CONSTRAINT fk_cidadaos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cidadaos_endereco_padrao
        FOREIGN KEY (endereco_padrao_id) REFERENCES enderecos(id)
        ON DELETE SET NULL
);
```

---

### 5.6 `gestores`

```sql
CREATE TABLE gestores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL,
    orgao_id    UUID NOT NULL,
    cargo       VARCHAR(100),

    CONSTRAINT uq_gestores_usuario UNIQUE (usuario_id),

    CONSTRAINT fk_gestores_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gestores_orgao
        FOREIGN KEY (orgao_id) REFERENCES orgaos_responsaveis(id)
        ON DELETE RESTRICT
);
```

---

### 5.7 `administradores`

```sql
CREATE TABLE administradores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id    UUID NOT NULL,
    nivel_acesso  nivel_acesso_admin NOT NULL DEFAULT 'padrao',

    CONSTRAINT uq_administradores_usuario UNIQUE (usuario_id),

    CONSTRAINT fk_administradores_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);
```

---

### 5.8 `demandas`

```sql
CREATE TABLE demandas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cidadao_id        UUID NOT NULL,
    endereco_id       UUID NOT NULL,
    categoria_id      UUID NOT NULL,
    orgao_id          UUID,
    titulo            VARCHAR(150) NOT NULL,
    descricao         TEXT NOT NULL,
    status            status_demanda NOT NULL DEFAULT 'registrada',
    prioridade        prioridade_demanda NOT NULL DEFAULT 'media',
    data_registro     TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_atualizacao  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_demandas_titulo_nao_vazio CHECK (length(trim(titulo)) > 0),
    CONSTRAINT chk_demandas_descricao_nao_vazia CHECK (length(trim(descricao)) > 0),

    CONSTRAINT fk_demandas_cidadao
        FOREIGN KEY (cidadao_id) REFERENCES cidadaos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_demandas_endereco
        FOREIGN KEY (endereco_id) REFERENCES enderecos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_demandas_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_problema(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_demandas_orgao
        FOREIGN KEY (orgao_id) REFERENCES orgaos_responsaveis(id)
        ON DELETE SET NULL
);

CREATE TRIGGER trg_demandas_updated_at
BEFORE UPDATE ON demandas
FOR EACH ROW
EXECUTE FUNCTION fn_set_updated_at();
```

---

### 5.9 `fotos`

```sql
CREATE TABLE fotos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_id      UUID NOT NULL,
    url             VARCHAR(255) NOT NULL,
    data_captura    TIMESTAMPTZ,
    latitude_exif   DECIMAL(9,6),
    longitude_exif  DECIMAL(9,6),
    data_upload     TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadados_exif  JSONB,

    CONSTRAINT chk_fotos_latitude_exif CHECK (latitude_exif IS NULL OR latitude_exif BETWEEN -90 AND 90),
    CONSTRAINT chk_fotos_longitude_exif CHECK (longitude_exif IS NULL OR longitude_exif BETWEEN -180 AND 180),

    CONSTRAINT fk_fotos_demanda
        FOREIGN KEY (demanda_id) REFERENCES demandas(id)
        ON DELETE CASCADE
);
```

---

### 5.10 `triagens_automaticas`

```sql
CREATE TABLE triagens_automaticas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_id              UUID NOT NULL,
    categoria_sugerida_id   UUID,
    orgao_sugerido_id       UUID,
    data_analise            TIMESTAMPTZ NOT NULL DEFAULT now(),
    nivel_confianca         DECIMAL(5,4) NOT NULL,
    labels_detectados       JSONB,
    status_revisao          status_revisao_triagem NOT NULL DEFAULT 'pendente',

    CONSTRAINT uq_triagens_demanda UNIQUE (demanda_id),
    CONSTRAINT chk_triagens_confianca CHECK (nivel_confianca BETWEEN 0 AND 1),

    CONSTRAINT fk_triagens_demanda
        FOREIGN KEY (demanda_id) REFERENCES demandas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_triagens_categoria_sugerida
        FOREIGN KEY (categoria_sugerida_id) REFERENCES categorias_problema(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_triagens_orgao_sugerido
        FOREIGN KEY (orgao_sugerido_id) REFERENCES orgaos_responsaveis(id)
        ON DELETE SET NULL
);
```

---

### 5.11 `historico_itens`

```sql
CREATE TABLE historico_itens (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demanda_id       UUID NOT NULL,
    gestor_id        UUID,
    status_anterior  status_demanda,
    status_novo      status_demanda NOT NULL,
    observacao       TEXT,
    data_alteracao   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_historico_demanda
        FOREIGN KEY (demanda_id) REFERENCES demandas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historico_gestor
        FOREIGN KEY (gestor_id) REFERENCES gestores(id)
        ON DELETE SET NULL
);
```

---

## 6. Índices Otimizados

```sql
-- Demandas: filtros e ordenações mais frequentes (listagem, painel do gestor, dashboard do cidadão)
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_categoria ON demandas(categoria_id);
CREATE INDEX idx_demandas_cidadao ON demandas(cidadao_id);
CREATE INDEX idx_demandas_orgao ON demandas(orgao_id);
CREATE INDEX idx_demandas_data_registro ON demandas(data_registro DESC);

-- Índice composto para o caso de uso "listar demandas de uma categoria com determinado status"
CREATE INDEX idx_demandas_categoria_status ON demandas(categoria_id, status);

-- Busca textual em titulo/descricao (trigram, suporta ILIKE '%termo%')
CREATE INDEX idx_demandas_titulo_trgm ON demandas USING gin (titulo gin_trgm_ops);
CREATE INDEX idx_demandas_descricao_trgm ON demandas USING gin (descricao gin_trgm_ops);

-- Endereços: consultas geoespaciais simples (faixas de lat/long)
CREATE INDEX idx_enderecos_geo ON enderecos(latitude, longitude);
CREATE INDEX idx_enderecos_bairro ON enderecos(bairro);

-- Histórico: recuperação da timeline de uma demanda (ordem cronológica)
CREATE INDEX idx_historico_demanda_data ON historico_itens(demanda_id, data_alteracao DESC);

-- Triagens: listagem de pendências de revisão (História 008)
CREATE INDEX idx_triagens_status_revisao ON triagens_automaticas(status_revisao);

-- Fotos: recuperação de todas as fotos de uma demanda
CREATE INDEX idx_fotos_demanda ON fotos(demanda_id);

-- JSONB: índice GIN para consultas sobre labels detectados pela IA
CREATE INDEX idx_triagens_labels_gin ON triagens_automaticas USING gin (labels_detectados);
```

---

## 7. Triggers de Auditoria e Negócio

### 7.1 Atualização automática de `data_atualizacao` em `demandas`

```sql
CREATE OR REPLACE FUNCTION fn_update_demanda_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_demanda_data_atualizacao
BEFORE UPDATE ON demandas
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION fn_update_demanda_timestamps();
```

> Observação: `trg_demandas_updated_at` (seção 5.8) atualiza `updated_at` (auditoria técnica); este trigger atualiza `data_atualizacao` (campo de negócio exibido ao cidadão).

---

### 7.2 Log automático de mudança de status (auditoria LGPD)

```sql
CREATE OR REPLACE FUNCTION fn_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO historico_itens (
            demanda_id, status_anterior, status_novo, observacao, data_alteracao
        ) VALUES (
            NEW.id, OLD.status, NEW.status, 'Alteração automática de status (trigger de auditoria)', now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_status_change
AFTER UPDATE ON demandas
FOR EACH ROW
EXECUTE FUNCTION fn_log_status_change();
```

---

### 7.3 Validação de confiança da triagem automática

```sql
CREATE OR REPLACE FUNCTION fn_validate_triagem_confianca()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nivel_confianca < 0.4 THEN
        NEW.status_revisao := 'pendente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_triagem_confianca
BEFORE INSERT OR UPDATE ON triagens_automaticas
FOR EACH ROW
EXECUTE FUNCTION fn_validate_triagem_confianca();
```

---

### 7.4 Trigger de auditoria genérica (tabela `audit_log`)

Para conformidade com LGPD/auditoria municipal, recomenda-se uma tabela central de auditoria que registra alterações em tabelas sensíveis (`usuarios`, `cidadaos`, `demandas`).

```sql
CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    tabela       VARCHAR(50) NOT NULL,
    operacao     VARCHAR(10) NOT NULL,
    registro_id  UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos   JSONB,
    usuario_db    VARCHAR(50) NOT NULL DEFAULT current_user,
    data_evento   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_tabela_registro ON audit_log(tabela, registro_id);

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (tabela, operacao, registro_id, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (tabela, operacao, registro_id, dados_antigos, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (tabela, operacao, registro_id, dados_antigos)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicação nas tabelas sensíveis
CREATE TRIGGER trg_audit_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_cidadaos
AFTER INSERT OR UPDATE OR DELETE ON cidadaos
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_demandas
AFTER INSERT OR UPDATE OR DELETE ON demandas
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
```

---

## 8. Stored Procedures

### 8.1 `sp_registrar_demanda`
Encapsula o fluxo da História 003 (registro de demanda pelo cidadão), garantindo atomicidade entre criação da demanda e do primeiro item de histórico.

```sql
CREATE OR REPLACE PROCEDURE sp_registrar_demanda(
    p_cidadao_id    UUID,
    p_endereco_id   UUID,
    p_categoria_id  UUID,
    p_titulo        VARCHAR,
    p_descricao     TEXT,
    p_prioridade    prioridade_demanda DEFAULT 'media',
    OUT p_demanda_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO demandas (cidadao_id, endereco_id, categoria_id, titulo, descricao, prioridade, status)
    VALUES (p_cidadao_id, p_endereco_id, p_categoria_id, p_titulo, p_descricao, p_prioridade, 'registrada')
    RETURNING id INTO p_demanda_id;

    INSERT INTO historico_itens (demanda_id, status_anterior, status_novo, observacao)
    VALUES (p_demanda_id, NULL, 'registrada', 'Demanda registrada pelo cidadão');
END;
$$;
```

**Exemplo de uso:**
```sql
CALL sp_registrar_demanda(
    'a1b2c3d4-...'::uuid,
    '1a2b3c4d-...'::uuid,
    'cat-001'::uuid,
    'Vazamento de esgoto na Av. Boa Viagem',
    'Há um vazamento constante próximo ao número 1200, causando mau odor.',
    'alta',
    NULL
);
```

---

### 8.2 `sp_atualizar_status_demanda`
Encapsula o fluxo da História 005 (atualização de status pelo gestor), inserindo o item de histórico com `gestor_id` e `observacao`.

```sql
CREATE OR REPLACE PROCEDURE sp_atualizar_status_demanda(
    p_demanda_id  UUID,
    p_gestor_id   UUID,
    p_novo_status status_demanda,
    p_observacao  TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_atual status_demanda;
BEGIN
    SELECT status INTO v_status_atual FROM demandas WHERE id = p_demanda_id FOR UPDATE;

    IF v_status_atual IS NULL THEN
        RAISE EXCEPTION 'Demanda % não encontrada', p_demanda_id;
    END IF;

    UPDATE demandas SET status = p_novo_status WHERE id = p_demanda_id;

    INSERT INTO historico_itens (demanda_id, gestor_id, status_anterior, status_novo, observacao)
    VALUES (p_demanda_id, p_gestor_id, v_status_atual, p_novo_status, p_observacao);
END;
$$;
```

> **Nota**: como `trg_log_status_change` (7.2) também insere em `historico_itens` em qualquer `UPDATE` de `status`, ao usar esta procedure haverá **dois registros** de histórico para a mesma transição (um genérico do trigger, outro detalhado da procedure). Recomenda-se **optar por uma das estratégias**: (a) usar apenas a procedure e remover o trigger 7.2, ou (b) manter apenas o trigger e preencher `gestor_id`/`observacao` via `UPDATE` direto com `SET LOCAL` de variável de sessão. A estratégia (a) é a recomendada — ver Checklist (seção 11).

---

### 8.3 `sp_processar_triagem_ia`
Encapsula o fluxo de inserção/atualização do resultado da triagem automática (integração com o serviço de IA via TensorFlow/MobileNet).

```sql
CREATE OR REPLACE PROCEDURE sp_processar_triagem_ia(
    p_demanda_id            UUID,
    p_categoria_sugerida_id UUID,
    p_orgao_sugerido_id     UUID,
    p_nivel_confianca       DECIMAL,
    p_labels_detectados     JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO triagens_automaticas (
        demanda_id, categoria_sugerida_id, orgao_sugerido_id, nivel_confianca, labels_detectados
    ) VALUES (
        p_demanda_id, p_categoria_sugerida_id, p_orgao_sugerido_id, p_nivel_confianca, p_labels_detectados
    )
    ON CONFLICT (demanda_id) DO UPDATE SET
        categoria_sugerida_id = EXCLUDED.categoria_sugerida_id,
        orgao_sugerido_id     = EXCLUDED.orgao_sugerido_id,
        nivel_confianca       = EXCLUDED.nivel_confianca,
        labels_detectados     = EXCLUDED.labels_detectados,
        data_analise          = now(),
        status_revisao        = 'pendente';

    UPDATE demandas SET status = 'em_triagem' WHERE id = p_demanda_id AND status = 'registrada';
END;
$$;
```

---

### 8.4 `sp_aceitar_encaminhamento`
Encapsula a História 009 — gestor aceita a sugestão da IA, confirmando categoria e órgão da demanda.

```sql
CREATE OR REPLACE PROCEDURE sp_aceitar_encaminhamento(
    p_demanda_id UUID,
    p_gestor_id  UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_categoria_sugerida UUID;
    v_orgao_sugerido     UUID;
BEGIN
    SELECT categoria_sugerida_id, orgao_sugerido_id
    INTO v_categoria_sugerida, v_orgao_sugerido
    FROM triagens_automaticas
    WHERE demanda_id = p_demanda_id;

    IF v_orgao_sugerido IS NULL THEN
        RAISE EXCEPTION 'Triagem da demanda % não possui órgão sugerido', p_demanda_id;
    END IF;

    UPDATE demandas
    SET categoria_id = COALESCE(v_categoria_sugerida, categoria_id),
        orgao_id = v_orgao_sugerido,
        status = 'encaminhada'
    WHERE id = p_demanda_id;

    UPDATE triagens_automaticas
    SET status_revisao = 'aceita'
    WHERE demanda_id = p_demanda_id;

    INSERT INTO historico_itens (demanda_id, gestor_id, status_anterior, status_novo, observacao)
    VALUES (p_demanda_id, p_gestor_id, 'em_triagem', 'encaminhada', 'Encaminhamento sugerido pela IA aceito pelo gestor');
END;
$$;
```

---

## 9. Inserts de Dados Iniciais (Seed)

```sql
-- Categorias de problema
INSERT INTO categorias_problema (id, nome, descricao, icone, ativo) VALUES
('11111111-1111-1111-1111-111111111101', 'Saneamento', 'Problemas de esgoto, vazamentos e água', 'water-drop', true),
('11111111-1111-1111-1111-111111111102', 'Elétrico', 'Postes, fios soltos, falta de energia', 'bolt', true),
('11111111-1111-1111-1111-111111111103', 'Pavimentação', 'Buracos, calçadas danificadas', 'road', true),
('11111111-1111-1111-1111-111111111104', 'Iluminação Pública', 'Lâmpadas queimadas, postes apagados', 'lightbulb', true),
('11111111-1111-1111-1111-111111111105', 'Limpeza Urbana', 'Lixo acumulado, entulho', 'trash', true);

-- Órgãos responsáveis
INSERT INTO orgaos_responsaveis (id, nome, descricao, email_contato, telefone_contato, ativo) VALUES
('22222222-2222-2222-2222-222222222201', 'COMPESA', 'Companhia Pernambucana de Saneamento', 'contato@compesa.pe.gov.br', '0800 081 0195', true),
('22222222-2222-2222-2222-222222222202', 'CELPE/Neoenergia', 'Distribuidora de energia elétrica', 'atendimento@neoenergia.com', '0800 081 0123', true),
('22222222-2222-2222-2222-222222222203', 'EMLURB', 'Empresa de Manutenção e Limpeza Urbana do Recife', 'emlurb@recife.pe.gov.br', '0800 081 1078', true),
('22222222-2222-2222-2222-222222222204', 'Secretaria de Infraestrutura', 'Pavimentação e obras viárias', 'infraestrutura@recife.pe.gov.br', '(81) 3355-8000', true);

-- Usuários (exemplo: 1 cidadão, 1 gestor, 1 administrador)
INSERT INTO usuarios (id, nome, email, senha_hash, telefone, papel, ativo) VALUES
('33333333-3333-3333-3333-333333333301', 'Maria Silva', 'maria.silva@email.com', '$2a$10$exemploHashBcrypt1234567890abcdefghijk', '(81) 98888-1111', 'cidadao', true),
('33333333-3333-3333-3333-333333333302', 'João Pereira', 'joao.pereira@compesa.pe.gov.br', '$2a$10$exemploHashBcrypt0987654321zyxwvutsrqp', '(81) 98888-2222', 'gestor', true),
('33333333-3333-3333-3333-333333333303', 'Admin Urbanize', 'admin@urbanize.gov.br', '$2a$10$exemploHashBcryptAdmin000000000000000', '(81) 98888-3333', 'administrador', true);

-- Endereço de exemplo
INSERT INTO enderecos (id, logradouro, numero, bairro, cidade, estado, cep, latitude, longitude, ponto_referencia) VALUES
('44444444-4444-4444-4444-444444444401', 'Av. Boa Viagem', '1200', 'Boa Viagem', 'Recife', 'PE', '51020-000', -8.122000, -34.897000, 'Próximo ao shopping');

-- Especializações
INSERT INTO cidadaos (id, usuario_id, cpf, endereco_padrao_id) VALUES
('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', '12345678901', '44444444-4444-4444-4444-444444444401');

INSERT INTO gestores (id, usuario_id, orgao_id, cargo) VALUES
('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'Analista de Operações');

INSERT INTO administradores (id, usuario_id, nivel_acesso) VALUES
('77777777-7777-7777-7777-777777777701', '33333333-3333-3333-3333-333333333303', 'master');

-- Demanda de exemplo
INSERT INTO demandas (id, cidadao_id, endereco_id, categoria_id, titulo, descricao, status, prioridade) VALUES
('88888888-8888-8888-8888-888888888801', '55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401',
 '11111111-1111-1111-1111-111111111101', 'Vazamento de esgoto na Av. Boa Viagem',
 'Há um vazamento constante próximo ao número 1200, causando mau odor e poças na rua.',
 'registrada', 'alta');

-- Histórico inicial (também seria gerado pelo trigger/procedure)
INSERT INTO historico_itens (demanda_id, status_anterior, status_novo, observacao) VALUES
('88888888-8888-8888-8888-888888888801', NULL, 'registrada', 'Demanda registrada pelo cidadão');

-- Foto de exemplo
INSERT INTO fotos (id, demanda_id, url, data_captura, latitude_exif, longitude_exif, metadados_exif) VALUES
('99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801',
 '/uploads/demandas/88888888/foto1.jpg', '2026-06-10 14:30:00-03', -8.122050, -34.897010,
 '{"camera": "iPhone 13", "resolucao": "4032x3024"}');

-- Triagem automática de exemplo
INSERT INTO triagens_automaticas (demanda_id, categoria_sugerida_id, orgao_sugerido_id, nivel_confianca, labels_detectados, status_revisao) VALUES
('88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
 0.8123,
 '{"predictions": [{"label": "manhole", "score": 0.81}, {"label": "puddle", "score": 0.62}], "modelo": "mobilenet_v2", "versao": "2.1.1"}',
 'pendente');
```

---

## 10. Views (Métricas)

```sql
CREATE VIEW vw_metricas_gestor AS
SELECT
    o.id AS orgao_id,
    o.nome AS orgao_nome,
    d.status,
    c.nome AS categoria_nome,
    COUNT(d.id) AS total_demandas,
    AVG(EXTRACT(EPOCH FROM (d.data_atualizacao - d.data_registro)) / 86400) AS tempo_medio_resolucao_dias
FROM demandas d
JOIN categorias_problema c ON c.id = d.categoria_id
LEFT JOIN orgaos_responsaveis o ON o.id = d.orgao_id
GROUP BY o.id, o.nome, d.status, c.nome;

CREATE VIEW vw_metricas_cidadao AS
SELECT
    c.id AS cidadao_id,
    COUNT(d.id) AS total_demandas,
    COUNT(d.id) FILTER (WHERE d.status = 'resolvida') AS demandas_resolvidas,
    COUNT(d.id) FILTER (WHERE d.status NOT IN ('resolvida','rejeitada')) AS demandas_em_andamento
FROM cidadaos c
LEFT JOIN demandas d ON d.cidadao_id = c.id
GROUP BY c.id;
```

---

## 11. Exemplos de Queries Críticas

### 11.1 Listar e filtrar demandas (História 006)
```sql
SELECT d.id, d.titulo, d.status, d.prioridade, c.nome AS categoria, d.data_registro
FROM demandas d
JOIN categorias_problema c ON c.id = d.categoria_id
WHERE d.status = 'em_andamento'
  AND d.categoria_id = '11111111-1111-1111-1111-111111111101'
ORDER BY d.data_registro DESC
LIMIT 20 OFFSET 0;
```

### 11.2 Detalhe da demanda com histórico completo (Histórias 004)
```sql
SELECT d.*,
       json_agg(
           json_build_object(
               'status_anterior', h.status_anterior,
               'status_novo', h.status_novo,
               'observacao', h.observacao,
               'data_alteracao', h.data_alteracao
           ) ORDER BY h.data_alteracao
       ) AS historico
FROM demandas d
LEFT JOIN historico_itens h ON h.demanda_id = d.id
WHERE d.id = '88888888-8888-8888-8888-888888888801'
GROUP BY d.id;
```

### 11.3 Triagens pendentes de revisão pelo gestor (História 008)
```sql
SELECT d.id AS demanda_id, d.titulo, t.nivel_confianca, t.labels_detectados,
       cp.nome AS categoria_sugerida, org.nome AS orgao_sugerido
FROM triagens_automaticas t
JOIN demandas d ON d.id = t.demanda_id
LEFT JOIN categorias_problema cp ON cp.id = t.categoria_sugerida_id
LEFT JOIN orgaos_responsaveis org ON org.id = t.orgao_sugerido_id
WHERE t.status_revisao = 'pendente'
ORDER BY t.nivel_confianca ASC; -- prioriza revisão das triagens menos confiáveis
```

### 11.4 Painel do gestor — totais por status no órgão (História 007)
```sql
SELECT status, COUNT(*) AS total
FROM demandas
WHERE orgao_id = '22222222-2222-2222-2222-222222222201'
GROUP BY status
ORDER BY total DESC;
```

### 11.5 Dashboard do cidadão (História 010)
```sql
SELECT * FROM vw_metricas_cidadao
WHERE cidadao_id = '55555555-5555-5555-5555-555555555501';
```

### 11.6 Demandas próximas a uma coordenada (busca simplificada por faixa, sem PostGIS)
```sql
SELECT d.id, d.titulo, e.latitude, e.longitude
FROM demandas d
JOIN enderecos e ON e.id = d.endereco_id
WHERE e.latitude BETWEEN -8.13 AND -8.11
  AND e.longitude BETWEEN -34.91 AND -34.88
  AND d.status NOT IN ('resolvida', 'rejeitada');
```

---

## 12. Checklist de Implementação

- [ ] Provisionar instância PostgreSQL (versão recomendada: 15+) — local (Docker) ou serviço gerenciado (Supabase, Neon, RDS)
- [ ] Habilitar extensões: `pgcrypto`, `pg_trgm` (PostGIS opcional na fase inicial)
- [ ] Executar DDL na ordem: ENUMs → função `fn_set_updated_at` → tabelas → triggers → índices → views → stored procedures
- [ ] Executar script de seed (categorias, órgãos, usuários de teste, demanda de exemplo)
- [ ] Decidir estratégia de histórico: usar `sp_atualizar_status_demanda` OU `trg_log_status_change` (não ambos simultaneamente — ver nota 8.2)
- [ ] Validar constraints (`CHECK`, `UNIQUE`, `FK`) com testes de inserção válida/inválida
- [ ] Configurar `pg_hba.conf`/variáveis de ambiente para acesso seguro (usuário de aplicação com permissões mínimas necessárias)
- [ ] Revisar índices após carga inicial de dados reais (usar `EXPLAIN ANALYZE` nas queries críticas da seção 11)

---

## 13. Próximas Etapas para Aplicação no Projeto

### 13.1 Migração do Prisma (SQLite → PostgreSQL)

1. Atualizar `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Substituir o adapter no código de inicialização do Prisma Client: trocar `@prisma/adapter-better-sqlite3` por `@prisma/adapter-pg` (ou equivalente compatível com Prisma 7.8).
3. Mapear os ENUMs do PostgreSQL (`status_demanda`, `prioridade_demanda`, etc.) para `enum` no schema Prisma.
4. Gerar a migration inicial: `npx prisma migrate dev --name init_postgres`.
5. Validar que os relacionamentos definidos no Prisma (`@relation`) correspondem exatamente às FKs do DDL (seção 5).

### 13.2 Substituição dos dados mockados

1. Identificar no frontend (Next.js) os pontos onde dados mockados são usados (listagem de demandas, categorias, órgãos, métricas dos dashboards).
2. Criar os endpoints/rotas no Express consumindo o Prisma Client para as entidades correspondentes.
3. Substituir chamadas a mocks por chamadas Axios às novas rotas, mantendo os mesmos contratos de tipo (TypeScript) já usados pelos componentes Chakra UI.
4. Para o estado global (Zustand), atualizar as stores para popular a partir das respostas da API em vez de arrays estáticos.

### 13.3 Integração da Triagem por IA

1. Implementar o serviço de inferência (TensorFlow/MobileNet) como rota separada (`/api/triagem`) que recebe a foto, executa a classificação e mapeia os resultados para `categoria_sugerida_id` / `orgao_sugerido_id` (via tabela de mapeamento label → categoria/órgão, a ser definida).
2. Ao final da inferência, chamar `sp_processar_triagem_ia` para persistir o resultado.
3. Implementar a tela de revisão do gestor (História 008) consumindo `vw_metricas_gestor` e a query 11.3 (triagens pendentes).
4. Implementar o botão "Aceitar sugestão" (História 009) chamando `sp_aceitar_encaminhamento`.

### 13.4 Cache e performance

1. Usar Redis (`ioredis`, já no stack) para cachear listas estáveis: `categorias_problema`, `orgaos_responsaveis` e resultados de `vw_metricas_gestor`/`vw_metricas_cidadao` (invalidação a cada N minutos ou em eventos de escrita relevantes).
2. Agendar via `node-cron` um job de atualização periódica de métricas pesadas, se necessário.

### 13.5 Segurança e LGPD

1. Garantir que `senha_hash` nunca seja retornado pela API (selecionar campos explicitamente no Prisma, nunca `SELECT *` exposto).
2. Avaliar criptografia em repouso para `cidadaos.cpf` (criptografia de coluna ou `pgcrypto`) além do hashing já planejado para senhas.
3. Definir política de retenção/anonimização para `audit_log` e `historico_itens`, alinhada à LGPD.
4. Revisar permissões do usuário de banco usado pela aplicação (sem `SUPERUSER`, sem `DROP`/`ALTER` em produção).

### 13.6 Evolução geoespacial (PostGIS)

Quando o volume e os casos de uso exigirem buscas de proximidade reais (ex.: "demandas em um raio de 500m"), migrar `enderecos.latitude`/`longitude` para uma coluna `GEOGRAPHY(Point, 4326)` via PostGIS, mantendo as colunas decimais para compatibilidade ou removendo-as após migração completa.