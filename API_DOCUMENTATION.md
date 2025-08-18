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

## 🔒 Controle de Acesso

### Roles (Funções)
- **SUPER_ADMIN**: Administrador do SaaS (acesso total)
- **ORG_ADMIN**: Administrador da organização
- **ORG_USER**: Usuário comum da organização
- **ORG_VIEWER**: Usuário com acesso apenas de visualização

### Status do Usuário
- **ACTIVE**: Usuário ativo
- **INACTIVE**: Usuário inativo
- **PENDING**: Usuário pendente de ativação

### Permissões por Endpoint

| Endpoint | SUPER_ADMIN | ORG_ADMIN | ORG_USER | ORG_VIEWER |
|----------|-------------|-----------|----------|------------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /auth/profile | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ |
| POST /auth/forgot-password | ✅ | ✅ | ✅ | ✅ |
| POST /auth/reset-password | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register | ✅ | ✅ | ❌ | ❌ |
| GET /auth/users | ✅ | ✅* | ❌ | ❌ |
| GET /auth/users/:id | ✅ | ✅* | ❌ | ❌ |
| PUT /auth/users/:id | ✅ | ✅* | ❌ | ❌ |
| DELETE /auth/users/:id | ✅ | ✅* | ❌ | ❌ |

*ORG_ADMIN só pode gerenciar usuários da própria organização

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

### 1. Login como Super Admin
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

### 2. Usar o token retornado
```bash
curl -X GET http://localhost:4000/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Criar um novo usuário
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "email": "novo@empresa.com",
    "password": "senha123",
    "name": "Novo Usuário",
    "organizationId": "cmeh3r34c0001vb6ogij4uflp",
    "role": "ORG_USER"
  }'
```
