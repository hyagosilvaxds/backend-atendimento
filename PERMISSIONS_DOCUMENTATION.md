# � Sistema de Permissões - Documentação Completa

Esta documentação detalha exclusivamente o sistema de permissões granulares implementado na API de Atendimento.

## Base URL
```
http://localhost:4000
```

## Autenticação
Todos os endpoints de permissões requerem autenticação JWT:
```
Authorization: Bearer <seu_jwt_token>
```

---

## 📋 Visão Geral do Sistema

### 🎯 Conceitos Fundamentais

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

#### Roles do Sistema
- **SUPER_ADMIN**: Administrador do SaaS (bypass de todas as verificações)
- **ORG_ADMIN**: Administrador da organização
- **ORG_USER**: Usuário comum da organização
- **ORG_VIEWER**: Usuário com acesso apenas de visualização

---

## 🔐 Endpoints de Permissões

### GET /auth/permissions
Lista todas as permissões disponíveis no sistema.

**Permissões Necessárias:** Usuário deve ser administrador (ORG_ADMIN ou SUPER_ADMIN)

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
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 2,
    "action": "READ",
    "resource": "SESSIONS",
    "description": "Visualizar sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 3,
    "action": "UPDATE",
    "resource": "SESSIONS",
    "description": "Atualizar sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 4,
    "action": "DELETE",
    "resource": "SESSIONS",
    "description": "Excluir sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 5,
    "action": "MANAGE",
    "resource": "SESSIONS",
    "description": "Gerenciar completamente sessões de atendimento",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 6,
    "action": "CREATE",
    "resource": "CONTACTS",
    "description": "Criar contatos",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 7,
    "action": "READ",
    "resource": "CONTACTS",
    "description": "Visualizar contatos",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 8,
    "action": "UPDATE",
    "resource": "CONTACTS",
    "description": "Atualizar contatos",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 9,
    "action": "DELETE",
    "resource": "CONTACTS",
    "description": "Excluir contatos",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  },
  {
    "id": 10,
    "action": "MANAGE",
    "resource": "CONTACTS",
    "description": "Gerenciar completamente contatos",
    "createdAt": "2025-08-18T12:39:50.489Z",
    "updatedAt": "2025-08-18T12:39:50.489Z"
  }
]
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Usuário não é administrador

---

### GET /auth/users/:id/permissions
Obtém todas as permissões de um usuário específico (role + permissões customizadas).

**Permissões Necessárias:** READ USERS ou ser o próprio usuário

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string): ID do usuário

**Response (200 OK):**
```json
{
  "userId": "cmeh3r36h0003vb6onolptzb1",
  "role": "ORG_USER",
  "rolePermissions": [
    {
      "id": 1,
      "roleId": "ORG_USER",
      "permissionId": 1,
      "permission": {
        "id": 1,
        "action": "CREATE",
        "resource": "SESSIONS",
        "description": "Criar sessões de atendimento"
      },
      "createdAt": "2025-08-18T12:39:50.489Z"
    },
    {
      "id": 2,
      "roleId": "ORG_USER",
      "permissionId": 2,
      "permission": {
        "id": 2,
        "action": "READ",
        "resource": "SESSIONS",
        "description": "Visualizar sessões de atendimento"
      },
      "createdAt": "2025-08-18T12:39:50.489Z"
    },
    {
      "id": 3,
      "roleId": "ORG_USER",
      "permissionId": 3,
      "permission": {
        "id": 3,
        "action": "UPDATE",
        "resource": "SESSIONS",
        "description": "Atualizar sessões de atendimento"
      },
      "createdAt": "2025-08-18T12:39:50.489Z"
    }
  ],
  "userPermissions": [
    {
      "id": 5,
      "userId": "cmeh3r36h0003vb6onolptzb1",
      "permissionId": 15,
      "permission": {
        "id": 15,
        "action": "DELETE",
        "resource": "CONTACTS",
        "description": "Excluir contatos"
      },
      "grantedAt": "2025-08-18T14:30:00.000Z",
      "grantedBy": {
        "id": "admin-user-id",
        "name": "Admin Sistema",
        "email": "admin@sistema.com"
      }
    }
  ],
  "allPermissions": [
    {
      "id": 1,
      "action": "CREATE",
      "resource": "SESSIONS",
      "description": "Criar sessões de atendimento",
      "source": "role"
    },
    {
      "id": 2,
      "action": "READ",
      "resource": "SESSIONS",
      "description": "Visualizar sessões de atendimento",
      "source": "role"
    },
    {
      "id": 3,
      "action": "UPDATE",
      "resource": "SESSIONS",
      "description": "Atualizar sessões de atendimento",
      "source": "role"
    },
    {
      "id": 15,
      "action": "DELETE",
      "resource": "CONTACTS",
      "description": "Excluir contatos",
      "source": "custom"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão para visualizar usuário
- `404 Not Found`: Usuário não encontrado

---

### POST /auth/users/:id/permissions
Adiciona permissões específicas a um usuário.

**Permissões Necessárias:** MANAGE USERS

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string): ID do usuário

**Payload:**
```json
{
  "permissionIds": [1, 2, 3, 15, 20]
}
```

**Validações:**
- `permissionIds` deve ser um array não vazio
- Cada ID deve ser um número inteiro válido
- Permissões devem existir no sistema
- Não é possível adicionar permissões duplicadas

**Response (200 OK):**
```json
{
  "message": "Permissões adicionadas com sucesso",
  "userId": "cmeh3r36h0003vb6onolptzb1",
  "addedPermissions": [
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
  ],
  "skippedPermissions": [
    {
      "id": 2,
      "reason": "Usuário já possui esta permissão através do role"
    }
  ],
  "totalAdded": 2,
  "totalSkipped": 1
}
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão para gerenciar usuários
- `404 Not Found`: Usuário não encontrado
- `400 Bad Request`: Dados inválidos
  ```json
  {
    "message": "Dados de entrada inválidos",
    "errors": [
      "permissionIds deve ser um array não vazio",
      "Permissão com ID 999 não encontrada"
    ]
  }
  ```

---

### DELETE /auth/users/:id/permissions
Remove permissões específicas de um usuário.

**Permissões Necessárias:** MANAGE USERS

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (string): ID do usuário

**Payload:**
```json
{
  "permissionIds": [1, 15]
}
```

**Validações:**
- `permissionIds` deve ser um array não vazio
- Cada ID deve ser um número inteiro válido
- Só é possível remover permissões customizadas (não do role)

**Response (200 OK):**
```json
{
  "message": "Permissões removidas com sucesso",
  "userId": "cmeh3r36h0003vb6onolptzb1",
  "removedPermissions": [
    {
      "id": 15,
      "action": "DELETE",
      "resource": "CONTACTS",
      "description": "Excluir contatos"
    }
  ],
  "skippedPermissions": [
    {
      "id": 1,
      "reason": "Esta permissão vem do role do usuário e não pode ser removida"
    }
  ],
  Cada endpoint valida automaticamente se o usuário possui a permissão necessária para executar a ação solicitada.
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão para gerenciar usuários
- `404 Not Found`: Usuário não encontrado
- `400 Bad Request`: Dados inválidos

---

### POST /auth/setup-permissions
Configura as permissões padrão para todos os roles do sistema.

**Permissões Necessárias:** SUPER_ADMIN apenas

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Permissões configuradas com sucesso",
  "rolesConfigured": [
    {
      "role": "ORG_ADMIN",
      "permissionsCount": 45,
      "permissions": [
        "MANAGE SESSIONS",
        "MANAGE CONTACTS", 
        "MANAGE MESSAGES",
        "MANAGE USERS",
        "MANAGE REPORTS",
        "MANAGE SETTINGS",
        "MANAGE TEMPLATES",
        "MANAGE TAGS",
        "READ AUDIT_LOGS"
      ]
    },
    {
      "role": "ORG_USER",
      "permissionsCount": 15,
      "permissions": [
        "CREATE SESSIONS",
        "READ SESSIONS",
        "UPDATE SESSIONS",
        "READ CONTACTS",
        "UPDATE CONTACTS",
        "CREATE MESSAGES",
        "READ MESSAGES",
        "READ TEMPLATES"
      ]
    },
    {
      "role": "ORG_VIEWER", 
      "permissionsCount": 6,
      "permissions": [
        "READ SESSIONS",
        "READ CONTACTS",
        "READ MESSAGES"
      ]
    }
  ],
  "totalPermissionsCreated": 60,
  "executionTime": "1.2s"
}
```

**Errors:**
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Apenas super admins podem executar esta ação
- `500 Internal Server Error`: Erro na configuração das permissões

---

## 📊 Matriz de Permissões Padrão

### SUPER_ADMIN
- **Acesso Total**: Bypass de todas as verificações de permissão
- **Todas as ações em todos os recursos**

### ORG_ADMIN
| Recurso | CREATE | READ | UPDATE | DELETE | MANAGE |
|---------|--------|------|--------|--------|--------|
| SESSIONS | ✅ | ✅ | ✅ | ✅ | ✅ |
| CONTACTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| MESSAGES | ✅ | ✅ | ✅ | ✅ | ✅ |
| USERS | ✅ | ✅ | ✅ | ✅ | ✅ |
| REPORTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| SETTINGS | ✅ | ✅ | ✅ | ✅ | ✅ |
| TEMPLATES | ✅ | ✅ | ✅ | ✅ | ✅ |
| TAGS | ✅ | ✅ | ✅ | ✅ | ✅ |
| AUDIT_LOGS | ❌ | ✅ | ❌ | ❌ | ❌ |
| ORGANIZATIONS | ❌ | ✅ | ✅ | ❌ | ❌ |
| INTEGRATIONS | ✅ | ✅ | ✅ | ❌ | ❌ |
| BILLING | ❌ | ✅ | ❌ | ❌ | ❌ |

### ORG_USER
| Recurso | CREATE | READ | UPDATE | DELETE | MANAGE |
|---------|--------|------|--------|--------|--------|
| SESSIONS | ✅ | ✅ | ✅* | ❌ | ❌ |
| CONTACTS | ❌ | ✅ | ✅ | ❌ | ❌ |
| MESSAGES | ✅ | ✅ | ✅* | ❌ | ❌ |
| TEMPLATES | ❌ | ✅ | ❌ | ❌ | ❌ |
| TAGS | ❌ | ✅ | ❌ | ❌ | ❌ |
| USERS | ❌ | ❌** | ❌ | ❌ | ❌ |
| REPORTS | ❌ | ❌ | ❌ | ❌ | ❌ |
| SETTINGS | ❌ | ❌ | ❌ | ❌ | ❌ |

*Apenas recursos que criou  
**Apenas próprio perfil

### ORG_VIEWER
| Recurso | CREATE | READ | UPDATE | DELETE | MANAGE |
|---------|--------|------|--------|--------|--------|
| SESSIONS | ❌ | ✅ | ❌ | ❌ | ❌ |
| CONTACTS | ❌ | ✅ | ❌ | ❌ | ❌ |
| MESSAGES | ❌ | ✅ | ❌ | ❌ | ❌ |
| TEMPLATES | ❌ | ✅ | ❌ | ❌ | ❌ |
| USERS | ❌ | ❌* | ❌ | ❌ | ❌ |

*Apenas próprio perfil

---

## 🔧 Como o Sistema Funciona

### 1. Verificação de Permissões
```typescript
// O sistema verifica permissões na seguinte ordem:
1. Se é SUPER_ADMIN → Acesso liberado
2. Verifica permissões do role
3. Verifica permissões customizadas do usuário
4. União das permissões (role + custom)
5. Valida se possui a permissão necessária
```

### 2. Decorators de Permissão
```typescript
// Exemplos de decorators usados nos controllers:
@CanCreateSessions()    // Verifica CREATE SESSIONS
@CanManageUsers()       // Verifica MANAGE USERS  
@CanReadContacts()      // Verifica READ CONTACTS
@CanDeleteSessions()    // Verifica DELETE SESSIONS
```

### 3. Guards de Proteção
```typescript
// Guards aplicados automaticamente:
@UseGuards(JwtAuthGuard, PermissionsGuard)
```

---

## 🧪 Testando o Sistema de Permissões

### Cenário 1: Visualizar todas as permissões
```bash
curl -X GET http://localhost:4000/auth/permissions \
  -H "Authorization: Bearer <admin_token>"
```

### Cenário 2: Ver permissões de um usuário
```bash
curl -X GET http://localhost:4000/auth/users/USER_ID/permissions \
  -H "Authorization: Bearer <admin_token>"
```

### Cenário 3: Conceder permissão especial
```bash
curl -X POST http://localhost:4000/auth/users/USER_ID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "permissionIds": [4, 9]
  }'
```

### Cenário 4: Remover permissão customizada
```bash
curl -X DELETE http://localhost:4000/auth/users/USER_ID/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "permissionIds": [4]
  }'
```

### Cenário 5: Setup inicial (apenas SUPER_ADMIN)
```bash
curl -X POST http://localhost:4000/auth/setup-permissions \
  -H "Authorization: Bearer <super_admin_token>"
```

---

## 📝 Códigos de Resposta

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| 200 | OK | Operação realizada com sucesso |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos no payload |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Sem permissão para a ação |
| 404 | Not Found | Usuário ou permissão não encontrada |
| 409 | Conflict | Permissão já existe para o usuário |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 🚨 Validações e Regras

### Regras de Negócio
1. **SUPER_ADMIN** pode fazer qualquer coisa (bypass total)
2. **Permissões de role** não podem ser removidas individualmente
3. **Permissões customizadas** são adicionais às do role
4. **ORG_ADMIN** só gerencia usuários da própria organização
5. **ORG_USER** só pode modificar recursos que criou
6. **Setup de permissões** só pode ser executado por SUPER_ADMIN

### Validações de Entrada
- IDs de permissão devem ser números inteiros válidos
- Arrays não podem estar vazios
- Permissões devem existir no sistema
- Usuário deve existir e estar ativo

### Limites e Restrições
- Máximo de 50 permissões por requisição
- Rate limit de 100 requests/minuto por usuário
- Logs de auditoria para todas as alterações de permissão

---

## 🔗 Integração com Outros Endpoints

O sistema de permissões se integra automaticamente com todos os endpoints da API:

- **Sessions**: Verificam permissões SESSIONS
- **Contacts**: Verificam permissões CONTACTS  
- **Messages**: Verificam permissões MESSAGES
- **Users**: Verificam permissões USERS
- **Reports**: Verificam permissões REPORTS

Cada endpoint valida automaticamente se o usuário possui a permissão necessária para executar a ação solicitada.
- **Herança de permissões** por organização
- **Guards automáticos** para endpoints

---

## 🎯 **Recursos e Ações**

### 📝 **Recursos (Resources)**
| Recurso | Descrição |
|---------|-----------|
| `SESSIONS` | Sessões de atendimento |
| `CONTACTS` | Contatos/Clientes |
| `MESSAGES` | Mensagens do chat |
| `ORG_SETTINGS` | Configurações da organização |
| `ORG_USERS` | Usuários da organização |
| `REPORTS` | Relatórios e analytics |
| `INTEGRATIONS` | Integrações externas |
| `WEBHOOKS` | Webhooks |
| `AUTOMATIONS` | Automações |
| `TAGS` | Tags e categorias |
| `DEPARTMENTS` | Departamentos |
| `QUEUES` | Filas de atendimento |

### ⚡ **Ações (Actions)**
| Ação | Descrição |
|------|-----------|
| `CREATE` | Criar novos itens |
| `READ` | Visualizar/listar itens |
| `UPDATE` | Editar itens existentes |
| `DELETE` | Remover itens |
| `MANAGE` | Controle total (inclui todas as ações) |

---

## 👥 **Sistema de Roles**

### 🔴 **SUPER_ADMIN**
- **Acesso total** ao sistema
- Pode gerenciar **todas as organizações**
- **Não precisa de permissões** específicas

### 🟡 **ORG_ADMIN**
- **Administrador da organização**
- `MANAGE` para: SESSIONS, CONTACTS, MESSAGES, ORG_SETTINGS, ORG_USERS, INTEGRATIONS, TAGS
- `READ` para: REPORTS

### 🟢 **ORG_USER**
- **Usuário operacional**
- `CREATE/READ/UPDATE` para: SESSIONS, CONTACTS, MESSAGES
- `READ` para: TAGS

### 🔵 **ORG_VIEWER**
- **Apenas visualização**
- `READ` para: SESSIONS, CONTACTS, MESSAGES, TAGS

---

## 🛡️ **Como Usar as Permissões**

### 1. **Decorators Prontos**
```typescript
// Em um controller
@CanCreateSessions()
@Post()
async createSession() { ... }

@CanManageContacts()
@Post('import')
async importContacts() { ... }

@CanReadReports()
@Get('analytics')
async getAnalytics() { ... }
```

### 2. **Decorators Personalizados**
```typescript
@RequirePermissions(
  { action: PermissionAction.CREATE, resource: PermissionResource.SESSIONS },
  { action: PermissionAction.UPDATE, resource: PermissionResource.SESSIONS }
)
@Post('bulk-update')
async bulkUpdate() { ... }
```

### 3. **Verificação Manual**
```typescript
const hasPermission = await this.permissionsService.hasPermission(
  userId,
  PermissionAction.CREATE,
  PermissionResource.SESSIONS,
  organizationId
);
```

---

## 🎮 **Endpoints de Permissões**

### **GET /auth/users/:id/permissions**
Obter permissões de um usuário específico.

**Response:**
```json
[
  {
    "action": "CREATE",
    "resource": "SESSIONS",
    "description": "Criar sessões de atendimento"
  },
  {
    "action": "READ",
    "resource": "CONTACTS",
    "description": "Visualizar contatos"
  }
]
```

### **POST /auth/users/:id/permissions**
Conceder permissão específica a um usuário.

**Payload:**
```json
{
  "action": "DELETE",
  "resource": "SESSIONS"
}
```

### **DELETE /auth/users/:id/permissions**
Revogar permissão específica de um usuário.

**Payload:**
```json
{
  "action": "DELETE",
  "resource": "SESSIONS"
}
```

### **POST /auth/setup-permissions**
Inicializar permissões padrão do sistema (Super Admin only).

---

## 📡 **Endpoints Protegidos por Permissões**

### 🎯 **Sessões (/sessions)**
| Endpoint | Permissão Necessária | Descrição |
|----------|---------------------|-----------|
| `GET /sessions` | `READ_SESSIONS` | Listar sessões |
| `POST /sessions` | `CREATE_SESSIONS` | Criar sessão |
| `GET /sessions/:id` | `READ_SESSIONS` | Obter sessão |
| `PUT /sessions/:id` | `UPDATE_SESSIONS` | Atualizar sessão |
| `DELETE /sessions/:id` | `DELETE_SESSIONS` | Deletar sessão |
| `POST /sessions/:id/assign` | `MANAGE_SESSIONS` | Atribuir sessão |
| `POST /sessions/:id/close` | `UPDATE_SESSIONS` | Fechar sessão |

### 👥 **Contatos (/contacts)**
| Endpoint | Permissão Necessária | Descrição |
|----------|---------------------|-----------|
| `GET /contacts` | `READ_CONTACTS` | Listar contatos |
| `POST /contacts` | `CREATE_CONTACTS` | Criar contato |
| `GET /contacts/:id` | `READ_CONTACTS` | Obter contato |
| `PUT /contacts/:id` | `UPDATE_CONTACTS` | Atualizar contato |
| `DELETE /contacts/:id` | `DELETE_CONTACTS` | Deletar contato |
| `POST /contacts/import` | `MANAGE_CONTACTS` | Importar contatos |
| `GET /contacts/:id/sessions` | `READ_CONTACTS` | Sessões do contato |
| `POST /contacts/:id/tag` | `UPDATE_CONTACTS` | Adicionar tag |

---

## 🔧 **Implementação Técnica**

### **1. Guards**
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@CanCreateSessions()
@Post()
async create() { ... }
```

### **2. Service**
```typescript
// Verificar permissão
const canCreate = await this.permissionsService.hasPermission(
  userId,
  PermissionAction.CREATE,
  PermissionResource.SESSIONS
);

// Obter todas as permissões do usuário
const permissions = await this.permissionsService.getUserPermissions(userId);
```

### **3. Database Schema**
```prisma
model Permission {
  action      PermissionAction
  resource    PermissionResource
  description String?
  
  rolePermissions RolePermission[]
  userPermissions UserPermission[]
}

model UserPermission {
  userId       String
  permissionId String
  granted      Boolean  // true = conceder, false = revogar
}
```

---

## 🚀 **Cenários de Uso**

### **1. Usuário Comum (ORG_USER)**
```bash
# ✅ PODE criar sessões
curl -X POST /sessions -H "Authorization: Bearer $TOKEN"

# ✅ PODE listar contatos  
curl -X GET /contacts -H "Authorization: Bearer $TOKEN"

# ❌ NÃO PODE deletar sessões
curl -X DELETE /sessions/123 -H "Authorization: Bearer $TOKEN"
# Response: 403 Forbidden
```

### **2. Admin da Organização (ORG_ADMIN)**
```bash
# ✅ PODE deletar sessões
curl -X DELETE /sessions/123 -H "Authorization: Bearer $TOKEN"

# ✅ PODE importar contatos
curl -X POST /contacts/import -H "Authorization: Bearer $TOKEN"

# ✅ PODE gerenciar usuários
curl -X POST /auth/register -H "Authorization: Bearer $TOKEN"
```

### **3. Permissões Personalizadas**
```bash
# Conceder permissão especial a um usuário
curl -X POST /auth/users/USER_ID/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"action": "DELETE", "resource": "SESSIONS"}'

# Agora o usuário PODE deletar sessões
```

---

## 📊 **Matriz de Permissões**

| Recurso / Role | SUPER_ADMIN | ORG_ADMIN | ORG_USER | ORG_VIEWER |
|----------------|-------------|-----------|----------|------------|
| **SESSIONS** | 🟢 MANAGE | 🟢 MANAGE | 🟡 CREATE/READ/UPDATE | 🔵 READ |
| **CONTACTS** | 🟢 MANAGE | 🟢 MANAGE | 🟡 CREATE/READ/UPDATE | 🔵 READ |
| **MESSAGES** | 🟢 MANAGE | 🟢 MANAGE | 🟡 CREATE/READ | 🔵 READ |
| **ORG_SETTINGS** | 🟢 MANAGE | 🟢 MANAGE | ❌ NONE | ❌ NONE |
| **ORG_USERS** | 🟢 MANAGE | 🟢 MANAGE | ❌ NONE | ❌ NONE |
| **REPORTS** | 🟢 MANAGE | 🔵 READ | ❌ NONE | ❌ NONE |
| **INTEGRATIONS** | 🟢 MANAGE | 🟢 MANAGE | ❌ NONE | ❌ NONE |
| **TAGS** | 🟢 MANAGE | 🟢 MANAGE | 🔵 READ | 🔵 READ |

---

## 🧪 **Testando o Sistema**

### **Script Automatizado**
```bash
# Executar todos os testes
./test-permissions.sh
```

### **Testes Manuais**
```bash
# 1. Login
TOKEN=$(curl -s -X POST /auth/login -d '{"email":"usuario@empresa.com","password":"user123"}' | jq -r '.access_token')

# 2. Testar permissão permitida
curl -X POST /sessions -H "Authorization: Bearer $TOKEN"

# 3. Testar permissão negada
curl -X DELETE /sessions/123 -H "Authorization: Bearer $TOKEN"

# 4. Ver permissões do usuário
curl -X GET /auth/profile -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 **Fluxo de Verificação**

1. **Usuário faz requisição** com JWT
2. **JwtAuthGuard** valida o token
3. **PermissionsGuard** verifica permissões:
   - Se SUPER_ADMIN → ✅ Permitir
   - Verificar permissões específicas do usuário
   - Verificar permissões da role
   - Se tem permissão → ✅ Permitir
   - Senão → ❌ 403 Forbidden

---

## 📈 **Benefícios**

- ✅ **Segurança granular** - Controle fino de acesso
- ✅ **Flexibilidade** - Permissões personalizadas por usuário  
- ✅ **Escalabilidade** - Fácil adição de novos recursos
- ✅ **Auditoria** - Rastreamento de permissões
- ✅ **Performance** - Verificações otimizadas
- ✅ **Multi-tenant** - Isolamento por organização

---

## 🎯 **Próximos Passos**

1. **Logs de auditoria** de acesso
2. **Permissões temporárias** com expiração
3. **Grupos de usuários** com permissões herdadas
4. **Interface visual** para gestão de permissões
5. **Cache de permissões** para performance
6. **Webhooks** para mudanças de permissões

**🔐 Sistema de permissões pronto para produção!**
