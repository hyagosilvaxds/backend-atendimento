# API de Autenticação - SaaS de Atendimento

Esta documentação descreve todos os endpoints da API de autenticação do sistema.

## Base URL
```
http://localhost:4000
```

## Autenticação
A API utiliza JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header Authorization:
```
Authorization: Bearer <seu_jwt_token>
```

---

## 📋 Endpoints

### 🔐 Autenticação

#### POST /auth/login
Autenticar usuário no sistema.

**Payload:**
```json
{
  "email": "admin@empresa.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmeh3r36h0003vb6onolptzb1",
    "email": "admin@empresa.com",
    "name": "Admin da Empresa",
    "role": "ORG_ADMIN",
    "organizationId": "cmeh3r34c0001vb6ogij4uflp",
    "organization": {
      "id": "cmeh3r34c0001vb6ogij4uflp",
      "name": "Empresa Exemplo",
      "slug": "empresa-exemplo"
    },
    "isSuperAdmin": false
  }
}
```

**Errors:**
- `401 Unauthorized`: Credenciais inválidas

---

#### POST /auth/logout
Fazer logout do sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

#### GET /auth/profile
Obter perfil do usuário logado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "cmeh3r36h0003vb6onolptzb1",
  "email": "admin@empresa.com",
  "name": "Admin da Empresa",
  "role": "ORG_ADMIN",
  "status": "ACTIVE",
  "emailVerified": true,
  "lastLoginAt": "2025-08-18T12:39:50.489Z",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z",
  "organization": {
    "id": "cmeh3r34c0001vb6ogij4uflp",
    "name": "Empresa Exemplo",
    "slug": "empresa-exemplo"
  }
}
```

---

### 🔑 Recuperação de Senha

#### POST /auth/forgot-password
Solicitar recuperação de senha.

**Payload:**
```json
{
  "email": "usuario@empresa.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Se o email existir, um link de recuperação será enviado"
}
```

---

#### POST /auth/reset-password
Redefinir senha usando token.

**Payload:**
```json
{
  "token": "abc123def456...",
  "password": "novaSenha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Senha alterada com sucesso"
}
```

**Errors:**
- `400 Bad Request`: Token inválido ou expirado

---

### 👥 Gerenciamento de Usuários

#### POST /auth/register
Registrar novo usuário (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "email": "novo@empresa.com",
  "password": "senha123",
  "name": "Novo Usuário",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "role": "ORG_USER"
}
```

**Response (201 Created):**
```json
{
  "id": "cmeh3r38p0005vb6o1s2d0lap",
  "email": "novo@empresa.com",
  "name": "Novo Usuário",
  "role": "ORG_USER",
  "status": "PENDING",
  "emailVerified": false,
  "lastLoginAt": null,
  "createdAt": "2025-08-18T12:39:50.570Z",
  "updatedAt": "2025-08-18T12:39:50.570Z",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "organization": {
    "id": "cmeh3r34c0001vb6ogij4uflp",
    "name": "Empresa Exemplo",
    "slug": "empresa-exemplo"
  }
}
```

**Errors:**
- `403 Forbidden`: Permissão insuficiente
- `409 Conflict`: Email já está em uso
- `404 Not Found`: Organização não encontrada

---

#### GET /auth/users
Listar usuários (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `organizationId` (opcional): ID da organização para filtrar (apenas para SUPER_ADMIN)

**Response (200 OK):**
```json
[
  {
    "id": "cmeh3r36h0003vb6onolptzb1",
    "email": "admin@empresa.com",
    "name": "Admin da Empresa",
    "role": "ORG_ADMIN",
    "status": "ACTIVE",
    "emailVerified": true,
    "lastLoginAt": "2025-08-18T12:39:50.489Z",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z",
    "organization": {
      "id": "cmeh3r34c0001vb6ogij4uflp",
      "name": "Empresa Exemplo",
      "slug": "empresa-exemplo"
    }
  }
]
```

---

#### GET /auth/users/:id
Obter usuário por ID (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "cmeh3r36h0003vb6onolptzb1",
  "email": "admin@empresa.com",
  "name": "Admin da Empresa",
  "role": "ORG_ADMIN",
  "status": "ACTIVE",
  "emailVerified": true,
  "lastLoginAt": "2025-08-18T12:39:50.489Z",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z",
  "organization": {
    "id": "cmeh3r34c0001vb6ogij4uflp",
    "name": "Empresa Exemplo",
    "slug": "empresa-exemplo"
  }
}
```

**Errors:**
- `404 Not Found`: Usuário não encontrado

---

#### PUT /auth/users/:id
Atualizar usuário (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "name": "Nome Atualizado",
  "role": "ORG_ADMIN",
  "status": "ACTIVE"
}
```

**Response (200 OK):**
```json
{
  "id": "cmeh3r36h0003vb6onolptzb1",
  "email": "admin@empresa.com",
  "name": "Nome Atualizado",
  "role": "ORG_ADMIN",
  "status": "ACTIVE",
  "emailVerified": true,
  "lastLoginAt": "2025-08-18T12:39:50.489Z",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T14:30:00.000Z",
  "organization": {
    "id": "cmeh3r34c0001vb6ogij4uflp",
    "name": "Empresa Exemplo",
    "slug": "empresa-exemplo"
  }
}
```

**Errors:**
- `404 Not Found`: Usuário não encontrado

---

#### DELETE /auth/users/:id
Remover usuário (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Usuário removido com sucesso"
}
```

**Errors:**
- `404 Not Found`: Usuário não encontrado

---

### 🔑 Gerenciamento de Permissões

#### GET /auth/permissions
Listar todas as permissões disponíveis no sistema (apenas admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "action": "CREATE",
    "resource": "SESSIONS",
    "description": "Criar sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 2,
    "action": "READ",
    "resource": "SESSIONS",
    "description": "Visualizar sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z"
  }
]
```

**Errors:**
- `403 Forbidden`: Usuário não é administrador

---

#### GET /auth/users/:id/permissions
Obter todas as permissões de um usuário específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "rolePermissions": [
    {
      "permission": {
        "id": 1,
        "action": "CREATE",
        "resource": "SESSIONS",
        "description": "Criar sessões de atendimento"
      }
    }
  ],
  "userPermissions": [
    {
      "permission": {
        "id": 15,
        "action": "DELETE",
        "resource": "CONTACTS",
        "description": "Excluir contatos"
      }
    }
  ],
  "allPermissions": [
    {
      "id": 1,
      "action": "CREATE",
      "resource": "SESSIONS",
      "description": "Criar sessões de atendimento"
    },
    {
      "id": 15,
      "action": "DELETE",
      "resource": "CONTACTS",
      "description": "Excluir contatos"
    }
  ]
}
```

**Errors:**
- `404 Not Found`: Usuário não encontrado

---

#### POST /auth/users/:id/permissions
Adicionar permissões específicas a um usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "permissionIds": [1, 2, 3]
}
```

**Response (200 OK):**
```json
{
  "message": "Permissões adicionadas com sucesso",
  "addedPermissions": [
    {
      "id": 1,
      "action": "CREATE",
      "resource": "SESSIONS"
    },
    {
      "id": 2,
      "action": "READ",
      "resource": "SESSIONS"
    }
  ]
}
```

**Errors:**
- `404 Not Found`: Usuário ou permissão não encontrada
- `400 Bad Request`: IDs de permissão inválidos

---

#### DELETE /auth/users/:id/permissions
Remover permissões específicas de um usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "permissionIds": [1, 2]
}
```

**Response (200 OK):**
```json
{
  "message": "Permissões removidas com sucesso",
  "removedPermissions": [
    {
      "id": 1,
      "action": "CREATE",
      "resource": "SESSIONS"
    }
  ]
}
```

**Errors:**
- `404 Not Found`: Usuário não encontrado

---

#### POST /auth/setup-permissions
Configurar permissões padrão para roles do sistema (apenas super admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Permissões configuradas com sucesso",
  "rolesConfigured": ["ORG_ADMIN", "ORG_USER"]
}
```

**Errors:**
- `403 Forbidden`: Apenas super admins podem executar esta ação

---

### 💬 Sessões de Atendimento

#### GET /sessions
Listar sessões de atendimento com paginação.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "session-uuid-here",
      "subject": "Suporte técnico",
      "status": "OPEN",
      "priority": "MEDIUM",
      "channel": "WHATSAPP",
      "createdAt": "2025-08-18T12:39:50.489Z",
      "updatedAt": "2025-08-18T12:39:50.489Z",
      "contact": {
        "id": "contact-uuid-here",
        "name": "João Silva",
        "email": "joao@cliente.com"
      },
      "assignedTo": {
        "id": "user-uuid-here",
        "name": "Atendente Maria"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Permissões Necessárias:** READ SESSIONS

---

#### POST /sessions
Criar nova sessão de atendimento.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "contactId": "contact-uuid-here",
  "channel": "WHATSAPP",
  "subject": "Suporte técnico",
  "priority": "MEDIUM"
}
```

**Response (201 Created):**
```json
{
  "id": "session-uuid-here",
  "subject": "Suporte técnico",
  "status": "OPEN",
  "priority": "MEDIUM",
  "channel": "WHATSAPP",
  "contactId": "contact-uuid-here",
  "createdById": "user-uuid-here",
  "organizationId": "org-uuid-here",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z"
}
```

**Permissões Necessárias:** CREATE SESSIONS

**Errors:**
- `404 Not Found`: Contato não encontrado
- `403 Forbidden`: Sem permissão para criar sessões

---

#### GET /sessions/:id
Buscar sessão específica por ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "session-uuid-here",
  "subject": "Suporte técnico",
  "status": "OPEN",
  "priority": "MEDIUM",
  "channel": "WHATSAPP",
  "notes": "Cliente relatou problema no sistema",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z",
  "contact": {
    "id": "contact-uuid-here",
    "name": "João Silva",
    "email": "joao@cliente.com"
  },
  "assignedTo": {
    "id": "user-uuid-here",
    "name": "Atendente Maria"
  },
  "createdBy": {
    "id": "creator-uuid-here",
    "name": "Admin Sistema"
  }
}
```

**Permissões Necessárias:** READ SESSIONS

**Errors:**
- `404 Not Found`: Sessão não encontrada

---

#### PUT /sessions/:id
Atualizar dados da sessão.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "subject": "Suporte técnico - Atualizado",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "notes": "Problema identificado, trabalhando na solução"
}
```

**Response (200 OK):**
```json
{
  "id": "session-uuid-here",
  "subject": "Suporte técnico - Atualizado",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "notes": "Problema identificado, trabalhando na solução",
  "updatedAt": "2025-08-18T14:30:00.000Z"
}
```

**Permissões Necessárias:** UPDATE SESSIONS

**Errors:**
- `404 Not Found`: Sessão não encontrada
- `403 Forbidden`: Sem permissão para atualizar sessões

---

#### DELETE /sessions/:id
Remover sessão do sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Sessão removida com sucesso"
}
```

**Permissões Necessárias:** DELETE SESSIONS

**Errors:**
- `404 Not Found`: Sessão não encontrada
- `403 Forbidden`: Sem permissão para deletar sessões

---

#### POST /sessions/:id/assign
Atribuir sessão a um atendente.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "assignedToId": "user-uuid-here"
}
```

**Response (200 OK):**
```json
{
  "id": "session-uuid-here",
  "subject": "Suporte técnico",
  "assignedToId": "user-uuid-here",
  "assignedTo": {
    "id": "user-uuid-here",
    "name": "Atendente Maria"
  },
  "updatedAt": "2025-08-18T14:30:00.000Z"
}
```

**Permissões Necessárias:** MANAGE SESSIONS

**Errors:**
- `404 Not Found`: Sessão ou usuário não encontrado
- `403 Forbidden`: Sem permissão para gerenciar sessões

---

#### POST /sessions/:id/close
Encerrar sessão com resolução.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "resolution": "Problema resolvido com sucesso",
  "rating": 5
}
```

**Response (200 OK):**
```json
{
  "id": "session-uuid-here",
  "status": "CLOSED",
  "resolution": "Problema resolvido com sucesso",
  "rating": 5,
  "closedAt": "2025-08-18T15:00:00.000Z",
  "updatedAt": "2025-08-18T15:00:00.000Z"
}
```

**Permissões Necessárias:** UPDATE SESSIONS

**Errors:**
- `404 Not Found`: Sessão não encontrada
- `400 Bad Request`: Sessão já está fechada

---

### 👤 Contatos

#### GET /contacts
Listar contatos com paginação.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "contact-uuid-here",
      "name": "João Silva",
      "email": "joao@cliente.com",
      "phone": "+5511999999999",
      "whatsapp": "+5511999999999",
      "document": "12345678901",
      "notes": "Cliente VIP",
      "tags": ["VIP", "Preferencial"],
      "createdAt": "2025-08-18T12:39:50.489Z",
      "updatedAt": "2025-08-18T12:39:50.489Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Permissões Necessárias:** READ CONTACTS

---

#### POST /contacts
Criar novo contato.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "name": "João Silva",
  "email": "joao@cliente.com",
  "phone": "+5511999999999",
  "whatsapp": "+5511999999999",
  "document": "12345678901",
  "notes": "Cliente VIP"
}
```

**Response (201 Created):**
```json
{
  "id": "contact-uuid-here",
  "name": "João Silva",
  "email": "joao@cliente.com",
  "phone": "+5511999999999",
  "whatsapp": "+5511999999999",
  "document": "12345678901",
  "notes": "Cliente VIP",
  "tags": [],
  "organizationId": "org-uuid-here",
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z"
}
```

**Permissões Necessárias:** CREATE CONTACTS

**Errors:**
- `409 Conflict`: Email ou documento já existe
- `403 Forbidden`: Sem permissão para criar contatos

---

#### GET /contacts/:id
Buscar contato específico por ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "contact-uuid-here",
  "name": "João Silva",
  "email": "joao@cliente.com",
  "phone": "+5511999999999",
  "whatsapp": "+5511999999999",
  "document": "12345678901",
  "notes": "Cliente VIP",
  "tags": ["VIP"],
  "createdAt": "2025-08-18T12:39:50.489Z",
  "updatedAt": "2025-08-18T12:39:50.489Z"
}
```

**Permissões Necessárias:** READ CONTACTS

**Errors:**
- `404 Not Found`: Contato não encontrado

---

#### PUT /contacts/:id
Atualizar dados do contato.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@cliente.com",
  "phone": "+5511888888888",
  "notes": "Cliente VIP - Atualizado"
}
```

**Response (200 OK):**
```json
{
  "id": "contact-uuid-here",
  "name": "João Silva Santos",
  "email": "joao.santos@cliente.com",
  "phone": "+5511888888888",
  "notes": "Cliente VIP - Atualizado",
  "updatedAt": "2025-08-18T14:30:00.000Z"
}
```

**Permissões Necessárias:** UPDATE CONTACTS

**Errors:**
- `404 Not Found`: Contato não encontrado
- `403 Forbidden`: Sem permissão para atualizar contatos

---

#### DELETE /contacts/:id
Remover contato do sistema.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Contato removido com sucesso"
}
```

**Permissões Necessárias:** DELETE CONTACTS

**Errors:**
- `404 Not Found`: Contato não encontrado
- `403 Forbidden`: Sem permissão para deletar contatos

---

#### POST /contacts/import
Importar múltiplos contatos.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "contacts": [
    {
      "name": "Maria Oliveira",
      "email": "maria@cliente.com",
      "phone": "+5511777777777"
    },
    {
      "name": "Pedro Santos",
      "email": "pedro@cliente.com",
      "phone": "+5511666666666"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Contatos importados com sucesso",
  "imported": 2,
  "failed": 0,
  "contacts": [
    {
      "id": "contact-uuid-1",
      "name": "Maria Oliveira",
      "email": "maria@cliente.com"
    },
    {
      "id": "contact-uuid-2",
      "name": "Pedro Santos",
      "email": "pedro@cliente.com"
    }
  ]
}
```

**Permissões Necessárias:** CREATE CONTACTS

**Errors:**
- `403 Forbidden`: Sem permissão para criar contatos

---

#### GET /contacts/:id/sessions
Listar sessões de um contato específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "session-uuid-here",
    "subject": "Suporte técnico",
    "status": "CLOSED",
    "priority": "MEDIUM",
    "channel": "WHATSAPP",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T14:30:00.000Z",
    "assignedTo": {
      "id": "user-uuid-here",
      "name": "Atendente Maria"
    }
  }
]
```

**Permissões Necessárias:** READ SESSIONS

**Errors:**
- `404 Not Found`: Contato não encontrado

---

#### POST /contacts/:id/tag
Adicionar tag ao contato.

**Headers:**
```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "tag": "VIP"
}
```

**Response (200 OK):**
```json
{
  "id": "contact-uuid-here",
  "name": "João Silva",
  "tags": ["VIP", "Preferencial"],
  "updatedAt": "2025-08-18T14:30:00.000Z"
}
```

**Permissões Necessárias:** UPDATE CONTACTS

**Errors:**
- `404 Not Found`: Contato não encontrado
- `400 Bad Request`: Tag já existe para este contato

---

## 🔒 Controle de Acesso

### Roles (Funções)
- **SUPER_ADMIN**: Administrador do SaaS (acesso total a todas as organizações)
- **ORG_ADMIN**: Administrador da organização (acesso total dentro da organização)
- **ORG_USER**: Usuário comum da organização (permissões limitadas)
- **ORG_VIEWER**: Usuário com acesso apenas de visualização

### Status do Usuário
- **ACTIVE**: Usuário ativo
- **INACTIVE**: Usuário inativo
- **PENDING**: Usuário pendente de ativação

### 🔑 Sistema de Permissões Granulares

O sistema implementa controle de acesso baseado em permissões granulares. Cada permissão é composta por:

#### Ações (Actions)
- **CREATE**: Criar novos recursos
- **READ**: Visualizar recursos existentes
- **UPDATE**: Modificar recursos existentes
- **DELETE**: Remover recursos
- **MANAGE**: Controle total (inclui todas as ações acima)

#### Recursos (Resources)
- **SESSIONS**: Sessões de atendimento
- **CONTACTS**: Contatos de clientes
- **MESSAGES**: Mensagens de atendimento
- **USERS**: Usuários do sistema
- **ORGANIZATIONS**: Organizações
- **REPORTS**: Relatórios e estatísticas
- **SETTINGS**: Configurações do sistema
- **INTEGRATIONS**: Integrações externas
- **BILLING**: Faturamento e pagamentos
- **AUDIT_LOGS**: Logs de auditoria
- **TEMPLATES**: Templates de mensagens
- **TAGS**: Tags para categorização

### Permissões Padrão por Role

#### SUPER_ADMIN
- **MANAGE** em todos os recursos
- Acesso total ao sistema

#### ORG_ADMIN
- **MANAGE SESSIONS**: Controle total das sessões
- **MANAGE CONTACTS**: Controle total dos contatos
- **MANAGE MESSAGES**: Controle total das mensagens
- **MANAGE USERS**: Gerenciar usuários da organização
- **MANAGE REPORTS**: Acessar todos os relatórios
- **MANAGE SETTINGS**: Configurar a organização
- **MANAGE TEMPLATES**: Gerenciar templates
- **MANAGE TAGS**: Gerenciar tags
- **READ AUDIT_LOGS**: Visualizar logs de auditoria

#### ORG_USER
- **CREATE SESSIONS**: Criar sessões de atendimento
- **READ SESSIONS**: Visualizar sessões
- **UPDATE SESSIONS**: Atualizar sessões que criou
- **READ CONTACTS**: Visualizar contatos
- **UPDATE CONTACTS**: Atualizar informações de contatos
- **CREATE MESSAGES**: Enviar mensagens
- **READ MESSAGES**: Visualizar mensagens
- **READ TEMPLATES**: Usar templates existentes

#### ORG_VIEWER
- **READ SESSIONS**: Apenas visualizar sessões
- **READ CONTACTS**: Apenas visualizar contatos
- **READ MESSAGES**: Apenas visualizar mensagens

### Permissões Customizadas

Além das permissões padrão por role, é possível conceder permissões específicas a usuários individuais através dos endpoints:

- `POST /auth/users/:id/permissions` - Adicionar permissões
- `DELETE /auth/users/:id/permissions` - Remover permissões
- `GET /auth/users/:id/permissions` - Listar permissões do usuário

### Verificação de Permissões

O sistema verifica permissões usando decorators nos endpoints:

```typescript
@CanCreateSessions() // Verifica CREATE SESSIONS
@CanManageUsers()    // Verifica MANAGE USERS
@CanReadContacts()   // Verifica READ CONTACTS
```

### Hierarquia de Permissões

1. **SUPER_ADMIN**: Bypass de todas as verificações
2. **Role Permissions**: Permissões padrão do role do usuário
3. **User Permissions**: Permissões específicas do usuário
4. **Final Check**: União de role + permissões específicas

### Permissões por Endpoint

| Endpoint | Permissão Necessária | SUPER_ADMIN | ORG_ADMIN | ORG_USER | ORG_VIEWER |
|----------|---------------------|-------------|-----------|----------|------------|
| **Autenticação** |
| POST /auth/login | Nenhuma | ✅ | ✅ | ✅ | ✅ |
| GET /auth/profile | Autenticado | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | Autenticado | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register | MANAGE USERS | ✅ | ✅ | ❌ | ❌ |
| GET /auth/users | READ USERS | ✅ | ✅* | ❌ | ❌ |
| PUT /auth/users/:id | UPDATE USERS | ✅ | ✅* | ❌ | ❌ |
| DELETE /auth/users/:id | DELETE USERS | ✅ | ✅* | ❌ | ❌ |
| **Permissões** |
| GET /auth/permissions | Administrador | ✅ | ✅ | ❌ | ❌ |
| GET /auth/users/:id/permissions | READ USERS | ✅ | ✅ | ❌ | ❌ |
| POST /auth/users/:id/permissions | MANAGE USERS | ✅ | ✅ | ❌ | ❌ |
| DELETE /auth/users/:id/permissions | MANAGE USERS | ✅ | ✅ | ❌ | ❌ |
| POST /auth/setup-permissions | SUPER_ADMIN | ✅ | ❌ | ❌ | ❌ |
| **Sessões** |
| GET /sessions | READ SESSIONS | ✅ | ✅ | ✅ | ✅ |
| POST /sessions | CREATE SESSIONS | ✅ | ✅ | ✅ | ❌ |
| GET /sessions/:id | READ SESSIONS | ✅ | ✅ | ✅ | ✅ |
| PUT /sessions/:id | UPDATE SESSIONS | ✅ | ✅ | ✅** | ❌ |
| DELETE /sessions/:id | DELETE SESSIONS | ✅ | ✅ | ❌ | ❌ |
| POST /sessions/:id/assign | MANAGE SESSIONS | ✅ | ✅ | ❌ | ❌ |
| POST /sessions/:id/close | UPDATE SESSIONS | ✅ | ✅ | ✅** | ❌ |
| **Contatos** |
| GET /contacts | READ CONTACTS | ✅ | ✅ | ✅ | ✅ |
| POST /contacts | CREATE CONTACTS | ✅ | ✅ | ❌ | ❌ |
| GET /contacts/:id | READ CONTACTS | ✅ | ✅ | ✅ | ✅ |
| PUT /contacts/:id | UPDATE CONTACTS | ✅ | ✅ | ✅ | ❌ |
| DELETE /contacts/:id | DELETE CONTACTS | ✅ | ✅ | ❌ | ❌ |
| POST /contacts/import | CREATE CONTACTS | ✅ | ✅ | ❌ | ❌ |
| GET /contacts/:id/sessions | READ SESSIONS | ✅ | ✅ | ✅ | ✅ |
| POST /contacts/:id/tag | UPDATE CONTACTS | ✅ | ✅ | ✅ | ❌ |

**Notas:**
- `*` ORG_ADMIN só pode gerenciar usuários da própria organização
- `**` ORG_USER só pode atualizar sessões que criou
- SUPER_ADMIN tem acesso irrestrito a todas as funcionalidades

---

## 🚨 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email já existe) |
| 500 | Internal Server Error - Erro interno |

---

## 📝 Validações

### Email
- Deve ser um email válido
- Deve ser único no sistema

### Senha
- Mínimo de 6 caracteres
- Será hasheada automaticamente

### Nome
- Campo obrigatório
- String não vazia

### OrganizationId
- Deve existir no banco de dados
- CUID válido

---

## 🔧 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://postgres:atens12345@localhost:5435/atendimento"
JWT_SECRET="sua-chave-secreta-super-segura-aqui-2025"
PORT=4000
```

---

## 🚀 Como Testar

### 1. Setup Inicial do Sistema
```bash
# Executar migrações e seeds
npm run db:migrate:deploy
npm run db:seed
```

### 2. Login como Super Admin
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

### 3. Login como Admin da Organização
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123"
  }'
```

### 4. Login como Usuário Comum
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@empresa.com",
    "password": "user123"
  }'
```

### 5. Testar Sistema de Permissões

#### Listar todas as permissões (como admin)
```bash
curl -X GET http://localhost:4000/auth/permissions \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Ver permissões de um usuário
```bash
curl -X GET http://localhost:4000/auth/users/USER_ID/permissions \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

#### Adicionar permissão específica a um usuário
```bash
curl -X POST http://localhost:4000/auth/users/USER_ID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "permissionIds": [1, 2, 3]
  }'
```

### 6. Testar Endpoints de Sessões

#### Criar sessão (usuário comum - deve funcionar)
```bash
curl -X POST http://localhost:4000/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_USER" \
  -d '{
    "contactId": "CONTACT_ID",
    "channel": "WHATSAPP",
    "subject": "Suporte técnico",
    "priority": "MEDIUM"
  }'
```

#### Deletar sessão (usuário comum - deve falhar com 403)
```bash
curl -X DELETE http://localhost:4000/sessions/SESSION_ID \
  -H "Authorization: Bearer SEU_TOKEN_USER"
```

#### Deletar sessão (admin - deve funcionar)
```bash
curl -X DELETE http://localhost:4000/sessions/SESSION_ID \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

### 7. Testar Endpoints de Contatos

#### Criar contato
```bash
curl -X POST http://localhost:4000/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "name": "João Silva",
    "email": "joao@cliente.com",
    "phone": "+5511999999999",
    "whatsapp": "+5511999999999",
    "document": "12345678901",
    "notes": "Cliente VIP"
  }'
```

#### Listar contatos
```bash
curl -X GET http://localhost:4000/contacts?page=1&limit=10 \
  -H "Authorization: Bearer SEU_TOKEN_USER"
```

### 8. Cenários de Teste de Permissões

#### ✅ Cenários que DEVEM funcionar:

1. **Admin pode fazer tudo**
2. **ORG_USER pode criar sessões**
3. **ORG_USER pode atualizar contatos**
4. **ORG_VIEWER pode visualizar dados**

#### ❌ Cenários que DEVEM falhar (403 Forbidden):

1. **ORG_USER tentando deletar sessões**
2. **ORG_USER tentando gerenciar outros usuários**
3. **ORG_VIEWER tentando criar/modificar dados**
4. **Usuário sem token tentando acessar endpoints protegidos**

### 9. Usar a Coleção do Postman

Para testes mais completos, importe a coleção do Postman:

```bash
# Arquivos na pasta /postman/
- Sistema-Atendimento-Auth.postman_collection.json
- Sistema-Atendimento-Local.postman_environment.json
```

A coleção inclui:
- Todos os endpoints documentados
- Scripts automáticos para capturar tokens
- Testes de permissões automatizados
- Variáveis de ambiente pré-configuradas
