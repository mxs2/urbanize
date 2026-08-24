# Jornadas e Perfis de Usuário - Urbanize

> Documentação completa dos fluxos, permissões e comportamentos dos diferentes perfis de usuário da plataforma.

## Visão Geral

O Urbanize implementa diferenciação de perfis, onde cada tipo de usuário tem permissões próprias. São **2 perfis principais**: **Cidadão** e **Gestor Público**.

**Definição de perfil:**
- No cadastro, o perfil é escolhido no formulário.
- Nos usuários seed, `cidadao@urbanize.com` é cidadão e `gestor@urbanize.com` é gestor.
- O backend persiste e valida o perfil em rotas protegidas.

## Perfil 1: Cidadão (Usuário Comum)

### Identificação
- **Email demo:** `cidadao@urbanize.com`
- **Redirecionamento após login:** `/dashboard`

### Navegação Disponível

| Rota | Página | Descrição |
|------|--------|-----------|
| `/dashboard` | Dashboard do cidadão | Visão geral das demandas e métricas pessoais |
| `/demandas` | Demandas do cidadão | Lista apenas as demandas criadas por você |
| `/demandas/nova` | Criar demanda | Criar nova solicitação para a prefeitura |
| `/demandas/:id` | Detalhes | Ver timeline e status da demanda |

### Permissões

✅ **Pode fazer:**
- Criar novas demandas urbanas
- Visualizar suas próprias demandas
- Acompanhar status das suas solicitações
- Ver timeline de atualizações
- Consultar suas métricas pessoais

❌ **Não pode fazer:**
- Alterar status de demandas
- Acessar painel do gestor
- Ver demandas de outros cidadãos
- Encaminhar demandas para órgãos
- Revisar triagem automática

### Fluxo Detalhado

1. **Primeiro Acesso**
   - Acessa [Home](/) e entende a proposta
   - Clica em "Criar conta" → [Cadastro](/cadastro)
   - Preenche nome, email, senha e perfil
   - Redireciona automaticamente para `/dashboard`

2. **Login Recorrente**
   - Acessa [Login](/login)
   - Insere credenciais
   - Redireciona para `/dashboard`

3. **Criar Demanda**
   - Na home, clica "Registrar demanda" ou acessa `/demandas/nova`
   - Vai para `/demandas/nova`
   - Anexa uma foto do problema
   - A IA classifica a imagem e sugere órgão responsável
   - O sistema preenche automaticamente:
     - Título da demanda
     - Descrição detalhada
   - Completa o formulário:
     - Prioridade (baixa, média, alta)
     - Localização (endereço, bairro, cidade)
     - Ponto de referência, se necessário
   - Clica em "Enviar demanda"
   - Recebe toast de sucesso
   - Redireciona para `/demandas/:id` (detalhes)

4. **Acompanhar Demanda**
   - Acessa `/demandas`
   - Vê lista de cards com suas demandas
   - Pode filtrar por: status, categoria, busca
   - Clica em uma demanda → `/demandas/:id`
   - Visualiza:
     - Informações completas
     - Timeline de histórico
     - Status atual com badge colorido
     - Observações do gestor (se houver)

5. **Dashboard**
   - Consulta métricas resumidas:
     - Total de demandas criadas
     - Demandas em atendimento
     - Demandas resolvidas
     - Tempo médio de atendimento
   - Vê últimas 4 demandas criadas
   - Acesso rápido para criar nova demanda

### Indicadores Visuais

**Navbar:**
- Exibe apenas a marca Urbanize quando o usuário está autenticado.
- Para visitantes, exibe botões de entrada/cadastro.

**Dashboard:**
- Foco em "minhas demandas"
- Botão destaque para "Nova demanda"
- Métricas pessoais (não da cidade toda)
- Cards das últimas demandas

## Perfil 2: Gestor Público

### Identificação
- **Email demo:** `gestor@urbanize.com`
- **Redirecionamento após login:** `/gestor`

### Navegação Disponível

| Rota | Página | Descrição |
|------|--------|-----------|
| `/gestor` | Painel do Gestor | Métricas gerais, fila de triagem inteligente |
| `/demandas` | Demandas visíveis ao gestor | Lista demandas do órgão vinculado ou a fila geral quando não houver vínculo |
| `/demandas/:id` | Gerenciar | Ver detalhes e alterar status |

### Permissões

✅ **Pode fazer:**
- Visualizar demandas do órgão vinculado ou a fila geral quando não houver vínculo
- Alterar status de qualquer demanda
- Adicionar observações nas demandas
- Encaminhar demandas para órgãos competentes
- Revisar triagem inteligente gerada a partir da imagem
- Visualizar métricas gerais da cidade
- Filtrar demandas por múltiplos critérios

❌ **Não pode fazer:**
- Criar novas demandas (cidadãos criam, gestores gerenciam)
- Acessar dashboard do cidadão
- Deletar demandas

### Fluxo Detalhado

1. **Login**
   - Acessa [Login](/login)
   - Insere email `gestor@urbanize.com`
   - Sistema detecta perfil de gestor
   - Redireciona automaticamente para `/gestor`

2. **Painel do Gestor**
   - Visualiza badge "Modo gestor" (verde)
   - Vê métricas gerais:
     - Total de demandas
     - Em análise
     - Encaminhadas
     - Em atendimento
   - Acessa seção "Fila recente"
   - Pode filtrar por status
   - Acessa seção "Triagem Inteligente"

3. **Triagem Automática**
   - Sistema mostra demandas em análise
   - Para cada demanda, vê:
     - Foto enviada pelo cidadão
     - Texto descritivo da demanda
     - Sugestão de órgão responsável
     - Confiança da IA
   - Pode:
     - Aceitar sugestão → Encaminha automaticamente
     - Ajustar encaminhamento → Escolhe órgão diferente
     - Revisar detalhes → Vai para `/demandas/:id`

4. **Gerenciar Demandas**
   - Acessa `/demandas`
   - Vê demandas disponíveis no seu escopo de gestor
   - Aplica filtros:
     - Status (registrada, em análise, encaminhada, etc)
     - Categoria
     - Bairro
     - Busca por título
   - Clica em uma demanda → `/demandas/:id`
   - Visualiza informações completas
   - **Ações exclusivas do gestor:**
     - Alterar status por botões de ação
     - Adicionar observação
     - Ver histórico completo
     - Confirmar alteração de status
   - Recebe toast de sucesso
   - Demanda atualizada no histórico

5. **Fluxo de Atualização de Status**
   ```
   Registrada → Em análise → Encaminhada → Em atendimento → Resolvida
   ```
   - Cada mudança gera item no histórico
   - Observação do gestor é salva
   - Cidadão vê atualização em tempo real

### Indicadores Visuais

**Navbar:**
- Exibe apenas a marca Urbanize quando o usuário está autenticado.

**Painel do Gestor:**
- Badge verde "Modo gestor" no topo
- Ícone de escudo (FiShield)
- Seção "Triagem Inteligente" com ícone de CPU
- Métricas da cidade toda (não pessoais)
- Fila com filtros avançados

**Detalhes da Demanda:**
- Botões de alteração de status
- Campo de observação do gestor
- Histórico e dados da demanda

## Matriz de Proteção de Rotas

| Rota | Cidadão | Gestor | Sem Login | Comportamento |
|------|---------|--------|-----------|---------------|
| `/` (Home) | ✅ Acessa | ✅ Acessa | ✅ Acessa | Página pública |
| `/login` | ✅ Acessa | ✅ Acessa | ✅ Acessa | Página pública |
| `/cadastro` | ✅ Acessa | ✅ Acessa | ✅ Acessa | Página pública |
| `/dashboard` | ✅ Acessa | ❌ Redireciona | ❌ Redireciona | Redireciona gestor → `/gestor`, sem login → `/login` |
| `/demandas` | ✅ Suas demandas | ✅ Todas | ❌ Redireciona | Redireciona sem login → `/login` |
| `/demandas/nova` | ✅ Acessa | ❌ Redireciona | ❌ Redireciona | Redireciona gestor → `/gestor`, sem login → `/login` |
| `/demandas/:id` | ✅ Visualiza | ✅ Edita status | ❌ Redireciona | Cidadão só vê, gestor pode alterar |
| `/gestor` | ❌ Redireciona | ✅ Acessa | ❌ Redireciona | Redireciona cidadão → `/dashboard`, sem login → `/login` |

### Regras de Redirecionamento

**Usuário não autenticado:**
- Tenta acessar rota protegida → Redireciona para `/login`
- Após login bem-sucedido → Redireciona para rota principal do perfil

**Cidadão tenta acessar rota de gestor:**
- `/gestor` → Redireciona para `/dashboard`

**Gestor tenta acessar rota exclusiva de cidadão:**
- `/dashboard` → Redireciona para `/gestor`
- `/demandas/nova` → Redireciona para `/gestor`

## Estados de Feedback

Todos os perfis têm estados visuais completos:

### Loading States
- **Skeleton loaders** em listas de demandas
- **Spinners** em métricas
- **Botões com loading** durante ações (criar, atualizar)
- Componente `<LoadingState />` personalizado

### Empty States
- **Lista vazia de demandas:** Mensagem + CTA "Criar primeira demanda"
- **Busca sem resultados:** "Nenhuma demanda encontrada. Tente outros filtros"
- **Métricas zeradas:** Ilustração + texto motivacional
- Componente `<EmptyState />` personalizado

### Error States
- **Erro ao carregar:** Mensagem + botão "Tentar novamente"
- **Erro ao criar/atualizar:** Toast de erro + mensagem específica
- **Erro de rede:** "Verifique sua conexão"
- Componente `<ErrorState />` personalizado

### Toasts (Notificações)
- **Sucesso:** Verde, ícone de check, 3 segundos
- **Erro:** Vermelho, ícone de alerta, 5 segundos
- **Info:** Azul, ícone de informação, 4 segundos
- Posição: topo-direita (mobile: topo-centro)

## Implementação Técnica

### Arquivos Principais

**1. Persistência de Perfil**
```typescript
// frontend/src/store/authStore.ts
register: async (nome, email, senha, telefone, role = "cidadao") => {
  const { user, token } = await authService.register({ nome, email, telefone, senha, role });
  set({ user, token, loading: false });
};
```

**2. Proteção de Rotas**
```typescript
// frontend/src/components/auth/RoleProtectedRoute.tsx
export function RoleProtectedRoute({ 
  children, 
  allowedRoles 
}: Props) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      const redirect = user.role === "gestor" ? "/gestor" : "/dashboard";
      router.push(redirect);
    }
  }, [user, allowedRoles, router]);

  // Renderiza só se autorizado
  if (!user || !allowedRoles.includes(user.role)) {
    return <LoadingState />;
  }

  return <>{children}</>;
}
```

**3. Navegação Simplificada**
```typescript
// frontend/src/components/layout/AppNavbar.tsx
// Usuários autenticados veem apenas a marca Urbanize.
// Visitantes veem botões para login e cadastro.
{!user && (
  <>
    <Button as={Link} href="/login">Entrar</Button>
    <Button as={Link} href="/cadastro">Criar conta</Button>
  </>
)}
```

**4. Uso nas Páginas**
```typescript
// frontend/src/app/dashboard/page.tsx (Cidadão)
export default function DashboardPage() {
  return (
    <RoleProtectedRoute allowedRoles={["cidadao"]}>
      <AppLayout>
        {/* Conteúdo do dashboard */}
      </AppLayout>
    </RoleProtectedRoute>
  );
}

// frontend/src/app/gestor/page.tsx (Gestor)
export default function GestorPage() {
  return (
    <RoleProtectedRoute allowedRoles={["gestor"]}>
      <AppLayout>
        {/* Conteúdo do painel */}
      </AppLayout>
    </RoleProtectedRoute>
  );
}
```

## Guia de Testes

### Teste 1: Fluxo Completo do Cidadão

```bash
# Passo 1: Cadastro
1. Acesse: http://127.0.0.1:4100/cadastro
2. Preencha:
   - Nome: João Silva
   - Email: joao@urbanize.com
   - Senha
   - Perfil: Cidadão
3. Clique "Criar conta"
4. ✅ Deve redirecionar para /dashboard

# Passo 2: Criar Demanda
5. Acesse a home e clique em "Registrar demanda" ou abra /demandas/nova
6. ✅ Vai para /demandas/nova
7. Anexe uma foto do problema
8. ✅ Título e descrição são preenchidos automaticamente
9. Complete:
   - Prioridade: Média
   - Endereço: Rua das Flores, 100
   - Bairro: Centro
   - Cidade: Recife
10. Marque o aceite de compartilhamento
11. Clique "Enviar demanda"
12. ✅ Toast de sucesso aparece
13. ✅ Redireciona para /demandas/:id

# Passo 3: Acompanhar
14. Veja descrição, localização e timeline da demanda
15. Acesse /demandas
16. ✅ Sua demanda aparece na lista
17. ✅ Status: "Em análise"

# Passo 4: Proteção de Rotas
18. Tente acessar: http://127.0.0.1:4100/gestor
19. ✅ Redireciona para /dashboard
```

### Teste 2: Fluxo Completo do Gestor

```bash
# Passo 1: Login
1. Acesse: http://127.0.0.1:4100/login
2. Email: gestor@urbanize.com
3. Senha: demo
4. Clique "Entrar"
5. ✅ Redireciona para /gestor

# Passo 2: Revisar Painel
6. ✅ Badge "Modo gestor" visível
7. ✅ Vê métricas gerais da cidade
8. ✅ Seção "Triagem Inteligente" aparece
9. ✅ Fila de demandas com filtros

# Passo 3: Gerenciar Demanda
10. Acesse /demandas
11. ✅ Vê demandas disponíveis no escopo do gestor
12. Filtre por: Status = "Registrada"
13. Clique na demanda do João Silva
14. ✅ Vai para /demandas/:id

# Passo 4: Atualizar Status
15. Veja botões de ação do gestor
16. Clique em "Encaminhar" ou "Iniciar atendimento"
17. Adicione observação: "Equipe verificará o local"
18. ✅ Toast de sucesso
19. ✅ Timeline atualizada com novo item

# Passo 5: Proteção de Rotas
21. Tente acessar: http://127.0.0.1:4100/dashboard
22. ✅ Redireciona para /gestor
23. Tente acessar: http://127.0.0.1:4100/demandas/nova
24. ✅ Redireciona para /gestor
```

### Teste 3: Proteção de Rotas sem Login

```bash
1. Faça logout (ou abra janela anônima)
2. Tente acessar: http://127.0.0.1:4100/dashboard
3. ✅ Redireciona para /login
4. Tente acessar: http://127.0.0.1:4100/gestor
5. ✅ Redireciona para /login
6. Tente acessar: http://127.0.0.1:4100/demandas/nova
7. ✅ Redireciona para /login
8. Acesse: http://127.0.0.1:4100/
9. ✅ Home carrega normalmente (página pública)
```

## Regras de Negócio

### Criação de Demandas
- ✅ Apenas cidadãos podem criar
- ✅ Campos obrigatórios: título, descrição e localização
- ✅ Categoria é preenchida automaticamente pela triagem de imagem ou mantida como `outros` quando não houver classificação
- ✅ Protocolo gerado automaticamente (URB-XXXXX)
- ✅ Status inicial persistido como "em análise", com histórico de registro e triagem
- ✅ Origem sempre "cidadao"
- ✅ Data de criação automática

### Alteração de Status
- ✅ Apenas gestores podem alterar
- ✅ Fluxo sugerido: Registrada → Em análise → Encaminhada → Em atendimento → Resolvida
- ✅ Pode pular etapas se necessário
- ✅ Pode voltar para status anterior
- ✅ Cada alteração gera item no histórico
- ✅ Observação do gestor é opcional mas recomendada

### Visualização de Demandas
- ✅ Cidadãos veem apenas as próprias
- ✅ Gestores veem demandas do órgão vinculado ou a fila geral quando não houver vínculo
- ✅ Filtros aplicam para ambos os perfis
- ✅ Busca funciona em títulos e descrições

### Perfil de usuário
- ✅ Definido no cadastro ou no seed inicial
- ✅ Não pode ser alterada pelo usuário
- ✅ Persiste no localStorage (via Zustand persist)
