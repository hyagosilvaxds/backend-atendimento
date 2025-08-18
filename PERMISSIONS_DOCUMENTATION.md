# 🔐 Sistema de Permissões Granulares - Documentação

Sistema avançado de controle de acesso baseado em permissões granulares para o SaaS de atendimento.

## 📋 **Visão Geral**

O sistema implementa controle de acesso fino com:
- **Permissões granulares** por ação e recurso
- **Sistema hierárquico** de roles
- **Permissões personalizadas** por usuário
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
