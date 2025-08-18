# Sistema de Autenticação - SaaS de Atendimento

Este documento descreve a estrutura do banco de dados para o sistema de autenticação do SaaS de atendimento.

## Estrutura do Banco de Dados

### Modelos

#### SuperAdmin
- **Descrição**: Administradores do SaaS que têm acesso completo ao sistema
- **Campos**:
  - `id`: Identificador único (CUID)
  - `email`: Email único do super admin
  - `password`: Senha hasheada
  - `name`: Nome completo
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

#### Organization
- **Descrição**: Organizações/empresas que usam o SaaS
- **Campos**:
  - `id`: Identificador único (CUID)
  - `name`: Nome da organização
  - `slug`: Slug único para URLs amigáveis
  - `description`: Descrição opcional
  - `status`: Status da organização (ACTIVE, INACTIVE, PENDING)
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

#### User
- **Descrição**: Usuários das organizações
- **Campos**:
  - `id`: Identificador único (CUID)
  - `email`: Email único do usuário
  - `password`: Senha hasheada
  - `name`: Nome completo
  - `role`: Papel do usuário (SUPER_ADMIN, ORG_ADMIN, ORG_USER, ORG_VIEWER)
  - `status`: Status do usuário (ACTIVE, INACTIVE, PENDING)
  - `emailVerified`: Se o email foi verificado
  - `lastLoginAt`: Último login
  - `organizationId`: ID da organização (chave estrangeira)
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

#### PasswordReset
- **Descrição**: Tokens para recuperação de senha
- **Campos**:
  - `id`: Identificador único (CUID)
  - `token`: Token único para reset
  - `userId`: ID do usuário (chave estrangeira)
  - `expiresAt`: Data de expiração
  - `used`: Se o token foi usado
  - `createdAt`: Data de criação

#### Session
- **Descrição**: Sessões de usuários ativos
- **Campos**:
  - `id`: Identificador único (CUID)
  - `token`: Token único da sessão
  - `userId`: ID do usuário
  - `expiresAt`: Data de expiração
  - `createdAt`: Data de criação

### Enums

#### UserRole
- `SUPER_ADMIN`: Administrador do SaaS
- `ORG_ADMIN`: Administrador da organização
- `ORG_USER`: Usuário comum da organização
- `ORG_VIEWER`: Usuário com acesso apenas de visualização

#### UserStatus
- `ACTIVE`: Usuário ativo
- `INACTIVE`: Usuário inativo
- `PENDING`: Usuário pendente de ativação

## Configuração

### Banco de Dados
- **URL**: `postgresql://postgres:atens12345@localhost:5435/atendimento`
- **Provider**: PostgreSQL

### Comandos Úteis

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar migração
npx prisma migrate dev --name nome_da_migracao

# Executar seeds
npm run db:seed

# Visualizar banco (Prisma Studio)
npx prisma studio

# Reset do banco
npx prisma migrate reset
```

## Dados de Teste

Após executar o seed, você terá:

### Super Admin
- **Email**: admin@sistema.com
- **Senha**: admin123

### Organização de Exemplo
- **Nome**: Empresa Exemplo
- **Slug**: empresa-exemplo

### Admin da Organização
- **Email**: admin@empresa.com
- **Senha**: admin123
- **Role**: ORG_ADMIN

### Usuário Comum
- **Email**: usuario@empresa.com
- **Senha**: user123
- **Role**: ORG_USER

## Relacionamentos

- Uma **Organization** pode ter muitos **Users**
- Um **User** pertence a uma **Organization**
- Um **User** pode ter muitos **PasswordReset** tokens
- Todos os relacionamentos com User são cascateados (deletar organização deleta usuários)

## Segurança

- Senhas são hasheadas usando bcrypt
- Tokens de sessão e reset são únicos
- Emails são únicos globalmente
- Slugs de organização são únicos
