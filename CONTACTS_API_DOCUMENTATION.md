# 📖 Documentação de Endpoints - Módulo de Contatos

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token.

```bash
Authorization: Bearer <access_token>
```

Para obter o token:
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "admin123"
}
```

---

## 📋 Endpoints de Contatos

### 1. 📜 Listar Contatos

**Endpoint:** `GET /contacts`  
**Permissão:** `READ_CONTACTS`

#### Query Parameters (Opcionais)
```typescript
{
  search?: string;        // Busca por nome, telefone, email ou documento
  tagId?: string;         // Filtrar por tag específica
  isActive?: boolean;     // Filtrar por status (true/false)
  page?: number;          // Página (padrão: 1)
  limit?: number;         // Itens por página (padrão: 10)
  sortBy?: string;        // Campo de ordenação (padrão: 'createdAt')
  sortOrder?: 'asc' | 'desc'; // Ordem (padrão: 'desc')
}
```

#### Exemplo de Requisição
```bash
GET /contacts?search=João&limit=5&page=1&sortBy=name&sortOrder=asc
```

#### Resposta de Sucesso (200)
```json
{
  "data": [
    {
      "id": "cmehfu4cy0001vbvzdi43hr16",
      "name": "João Silva",
      "phone": "11999999999",
      "email": "joao@email.com",
      "document": null,
      "birthDate": null,
      "address": null,
      "city": null,
      "state": null,
      "zipCode": null,
      "notes": "Cliente VIP - prioridade no atendimento",
      "isActive": true,
      "createdAt": "2025-08-18T18:18:07.378Z",
      "updatedAt": "2025-08-18T18:38:26.366Z",
      "organizationId": "cmeh3r34c0001vb6ogij4uflp",
      "createdById": null,
      "contactTags": [
        {
          "id": "cmehgjrkm0003vb9i0paxhyru",
          "contactId": "cmehfu4cy0001vbvzdi43hr16",
          "tagId": "cmehgjfx30002vb9i28ylw58d",
          "createdAt": "2025-08-18T18:38:03.862Z",
          "tag": {
            "id": "cmehgjfx30002vb9i28ylw58d",
            "name": "VIP",
            "color": "#ff0000",
            "description": null,
            "createdAt": "2025-08-18T18:37:48.760Z",
            "updatedAt": "2025-08-18T18:37:48.760Z",
            "organizationId": "cmeh3r34c0001vb6ogij4uflp"
          }
        }
      ],
      "createdBy": null,
      "messages": [],
      "_count": {
        "messages": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### 2. 👤 Obter Contato Específico

**Endpoint:** `GET /contacts/:id`  
**Permissão:** `READ_CONTACTS`

#### Path Parameters
- `id` (string): ID do contato

#### Exemplo de Requisição
```bash
GET /contacts/cmehfu4cy0001vbvzdi43hr16
```

#### Resposta de Sucesso (200)
```json
{
  "id": "cmehfu4cy0001vbvzdi43hr16",
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "document": null,
  "birthDate": null,
  "address": null,
  "city": null,
  "state": null,
  "zipCode": null,
  "notes": "Cliente VIP - prioridade no atendimento",
  "isActive": true,
  "createdAt": "2025-08-18T18:18:07.378Z",
  "updatedAt": "2025-08-18T18:38:26.366Z",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "createdById": null,
  "contactTags": [
    {
      "id": "cmehgjrkm0003vb9i0paxhyru",
      "contactId": "cmehfu4cy0001vbvzdi43hr16",
      "tagId": "cmehgjfx30002vb9i28ylw58d",
      "createdAt": "2025-08-18T18:38:03.862Z",
      "tag": {
        "id": "cmehgjfx30002vb9i28ylw58d",
        "name": "VIP",
        "color": "#ff0000",
        "description": null,
        "createdAt": "2025-08-18T18:37:48.760Z",
        "updatedAt": "2025-08-18T18:37:48.760Z",
        "organizationId": "cmeh3r34c0001vb6ogij4uflp"
      }
    }
  ],
  "createdBy": null,
  "messages": [],
  "_count": {
    "messages": 0
  }
}
```

#### Resposta de Erro (404)
```json
{
  "message": "Contato não encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 3. ➕ Criar Contato

**Endpoint:** `POST /contacts`  
**Permissão:** `CREATE_CONTACTS`

#### Request Body
```typescript
{
  name: string;           // Obrigatório - Nome do contato
  phone: string;          // Obrigatório - Telefone (único por organização)
  email?: string;         // Opcional - Email
  document?: string;      // Opcional - CPF/CNPJ
  birthDate?: string;     // Opcional - Data de nascimento (ISO 8601)
  address?: string;       // Opcional - Endereço
  city?: string;          // Opcional - Cidade
  state?: string;         // Opcional - Estado
  zipCode?: string;       // Opcional - CEP
  notes?: string;         // Opcional - Observações
  isActive?: boolean;     // Opcional - Status (padrão: true)
  tagIds?: string[];      // Opcional - IDs das tags
}
```

#### Exemplo de Requisição
```bash
POST /contacts
Content-Type: application/json

{
  "name": "Maria Silva",
  "phone": "11988888888",
  "email": "maria@email.com",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "notes": "Cliente desde 2023",
  "tagIds": ["cmehgjfx30002vb9i28ylw58d"]
}
```

#### Resposta de Sucesso (201)
```json
{
  "id": "cmehg2zpb0006vbvz6o1a0oiy",
  "name": "Maria Silva",
  "phone": "11988888888",
  "email": "maria@email.com",
  "document": null,
  "birthDate": null,
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "notes": "Cliente desde 2023",
  "isActive": true,
  "createdAt": "2025-08-18T18:25:01.248Z",
  "updatedAt": "2025-08-18T18:25:01.248Z",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "createdById": "cmeh3r36h0003vb6onolptzb1",
  "contactTags": [
    {
      "id": "cmehgjrkm0003vb9i0paxhyru",
      "contactId": "cmehg2zpb0006vbvz6o1a0oiy",
      "tagId": "cmehgjfx30002vb9i28ylw58d",
      "createdAt": "2025-08-18T18:38:03.862Z",
      "tag": {
        "id": "cmehgjfx30002vb9i28ylw58d",
        "name": "VIP",
        "color": "#ff0000"
      }
    }
  ],
  "createdBy": {
    "id": "cmeh3r36h0003vb6onolptzb1",
    "name": "Admin da Empresa",
    "email": "admin@empresa.com"
  },
  "messages": [],
  "_count": {
    "messages": 0
  }
}
```

#### Resposta de Erro (409 - Telefone Duplicado)
```json
{
  "message": "Já existe um contato com este telefone",
  "error": "Conflict",
  "statusCode": 409
}
```

#### Resposta de Erro (400 - Validação)
```json
{
  "message": [
    "name should not be empty",
    "phone should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 4. ✏️ Atualizar Contato

**Endpoint:** `PUT /contacts/:id`  
**Permissão:** `UPDATE_CONTACTS`

#### Path Parameters
- `id` (string): ID do contato

#### Request Body
```typescript
{
  name?: string;          // Opcional - Nome do contato
  phone?: string;         // Opcional - Telefone
  email?: string;         // Opcional - Email
  document?: string;      // Opcional - CPF/CNPJ
  birthDate?: string;     // Opcional - Data de nascimento (ISO 8601)
  address?: string;       // Opcional - Endereço
  city?: string;          // Opcional - Cidade
  state?: string;         // Opcional - Estado
  zipCode?: string;       // Opcional - CEP
  notes?: string;         // Opcional - Observações
  isActive?: boolean;     // Opcional - Status
  tagIds?: string[];      // Opcional - IDs das tags (substitui todas)
}
```

#### Exemplo de Requisição
```bash
PUT /contacts/cmehfu4cy0001vbvzdi43hr16
Content-Type: application/json

{
  "notes": "Cliente VIP - prioridade no atendimento",
  "address": "Rua Nova, 456",
  "city": "São Paulo"
}
```

#### Resposta de Sucesso (200)
```json
{
  "id": "cmehfu4cy0001vbvzdi43hr16",
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "document": null,
  "birthDate": null,
  "address": "Rua Nova, 456",
  "city": "São Paulo",
  "state": null,
  "zipCode": null,
  "notes": "Cliente VIP - prioridade no atendimento",
  "isActive": true,
  "createdAt": "2025-08-18T18:18:07.378Z",
  "updatedAt": "2025-08-18T18:45:00.000Z",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "createdById": null,
  "contactTags": [],
  "createdBy": null,
  "messages": [],
  "_count": {
    "messages": 0
  }
}
```

---

### 5. 🗑️ Deletar Contato

**Endpoint:** `DELETE /contacts/:id`  
**Permissão:** `DELETE_CONTACTS`

#### Path Parameters
- `id` (string): ID do contato

#### Exemplo de Requisição
```bash
DELETE /contacts/cmehfu4cy0001vbvzdi43hr16
```

#### Resposta de Sucesso (200)
```json
{
  "message": "Contato removido com sucesso"
}
```

#### Resposta de Erro (404)
```json
{
  "message": "Contato não encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 🏷️ Endpoints de Tags

### 6. 📜 Listar Tags

**Endpoint:** `GET /contacts/tags`  
**Permissão:** `READ_CONTACTS`

#### Resposta de Sucesso (200)
```json
[
  {
    "id": "cmehgjfx30002vb9i28ylw58d",
    "name": "VIP",
    "color": "#ff0000",
    "description": null,
    "createdAt": "2025-08-18T18:37:48.760Z",
    "updatedAt": "2025-08-18T18:37:48.760Z",
    "organizationId": "cmeh3r34c0001vb6ogij4uflp",
    "_count": {
      "contactTags": 2
    }
  },
  {
    "id": "cmehfrrz10001vbngtuw4j92u",
    "name": "Cliente VIP",
    "color": "#FFD700",
    "description": "Clientes prioritários",
    "createdAt": "2025-08-18T18:16:18.013Z",
    "updatedAt": "2025-08-18T18:16:18.013Z",
    "organizationId": "cmeh3r34c0001vb6ogij4uflp",
    "_count": {
      "contactTags": 0
    }
  }
]
```

### 7. ➕ Criar Tag

**Endpoint:** `POST /contacts/tags`  
**Permissão:** `MANAGE_TAGS`

#### Request Body
```typescript
{
  name: string;           // Obrigatório - Nome da tag
  color: string;          // Obrigatório - Cor em hexadecimal (#ffffff)
  description?: string;   // Opcional - Descrição da tag
}
```

#### Exemplo de Requisição
```bash
POST /contacts/tags
Content-Type: application/json

{
  "name": "VIP",
  "color": "#ff0000",
  "description": "Clientes importantes"
}
```

#### Resposta de Sucesso (201)
```json
{
  "id": "cmehgjfx30002vb9i28ylw58d",
  "name": "VIP",
  "color": "#ff0000",
  "description": "Clientes importantes",
  "createdAt": "2025-08-18T18:37:48.760Z",
  "updatedAt": "2025-08-18T18:37:48.760Z",
  "organizationId": "cmeh3r34c0001vb6ogij4uflp",
  "_count": {
    "contactTags": 0
  }
}
```

### 8. 🔗 Adicionar Tag ao Contato

**Endpoint:** `POST /contacts/:contactId/tags/:tagId`  
**Permissão:** `UPDATE_CONTACTS`

#### Path Parameters
- `contactId` (string): ID do contato
- `tagId` (string): ID da tag

#### Exemplo de Requisição
```bash
POST /contacts/cmehfu4cy0001vbvzdi43hr16/tags/cmehgjfx30002vb9i28ylw58d
```

#### Resposta de Sucesso (200)
```json
{
  "message": "Tag adicionada ao contato com sucesso"
}
```

#### Resposta de Erro (409 - Tag já existe)
```json
{
  "message": "Tag já está associada a este contato",
  "error": "Conflict",
  "statusCode": 409
}
```

### 9. ❌ Remover Tag do Contato

**Endpoint:** `DELETE /contacts/:contactId/tags/:tagId`  
**Permissão:** `UPDATE_CONTACTS`

#### Path Parameters
- `contactId` (string): ID do contato
- `tagId` (string): ID da tag

#### Exemplo de Requisição
```bash
DELETE /contacts/cmehfu4cy0001vbvzdi43hr16/tags/cmehgjfx30002vb9i28ylw58d
```

#### Resposta de Sucesso (200)
```json
{
  "message": "Tag removida do contato com sucesso"
}
```

---

## 📊 Endpoints de Importação/Exportação

### 10. 📥 Download Template

**Endpoint:** `GET /contacts/template`  
**Permissão:** `READ_CONTACTS`

#### Exemplo de Requisição
```bash
GET /contacts/template
```

#### Resposta de Sucesso (200)
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="template-contatos.xlsx"`
- **Body:** Arquivo Excel binário

### 11. 📤 Exportar Contatos

**Endpoint:** `GET /contacts/export`  
**Permissão:** `READ_CONTACTS`

#### Query Parameters (Opcionais)
```typescript
{
  format?: 'xlsx' | 'csv';    // Formato do arquivo (padrão: xlsx)
  includeInactive?: boolean;   // Incluir contatos inativos (padrão: false)
  tagIds?: string[];          // Exportar apenas contatos com essas tags
}
```

#### Exemplo de Requisição
```bash
GET /contacts/export?format=xlsx&includeInactive=false
```

#### Resposta de Sucesso (200)
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="contatos-2025-08-18.xlsx"`
- **Body:** Arquivo Excel binário com todos os contatos

### 12. 📥 Importar via Arquivo

**Endpoint:** `POST /contacts/import`  
**Permissão:** `MANAGE_CONTACTS`

#### Request Body (multipart/form-data)
- `file`: Arquivo Excel (.xlsx, .xls) ou CSV

#### Exemplo de Requisição
```bash
POST /contacts/import
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="contatos.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary data]
--boundary--
```

#### Resposta de Sucesso (200)
```json
{
  "message": "Importação concluída com sucesso",
  "summary": {
    "total": 10,
    "success": 8,
    "errors": 2,
    "details": [
      {
        "row": 3,
        "error": "Telefone já existe: 11999999999"
      },
      {
        "row": 7,
        "error": "Email inválido: email-invalido"
      }
    ]
  }
}
```

### 13. 📥 Importar via JSON

**Endpoint:** `POST /contacts/import/json`  
**Permissão:** `MANAGE_CONTACTS`

#### Request Body
```typescript
{
  contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    document?: string;
    birthDate?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
    isActive?: boolean;
    tags?: string[];  // Nomes das tags
  }>
}
```

#### Exemplo de Requisição
```bash
POST /contacts/import/json
Content-Type: application/json

{
  "contacts": [
    {
      "name": "João Silva",
      "phone": "11999999999",
      "email": "joao@email.com",
      "city": "São Paulo",
      "tags": ["VIP", "Premium"]
    },
    {
      "name": "Maria Santos",
      "phone": "11888888888",
      "email": "maria@email.com",
      "notes": "Cliente especial"
    }
  ]
}
```

#### Resposta de Sucesso (200)
```json
{
  "message": "Importação concluída com sucesso",
  "summary": {
    "total": 2,
    "success": 2,
    "errors": 0,
    "details": []
  }
}
```

---

## 🚨 Códigos de Erro Comuns

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| 400 | Bad Request | Dados de entrada inválidos |
| 401 | Unauthorized | Token inválido ou expirado |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Contato/Tag não encontrado |
| 409 | Conflict | Telefone duplicado |
| 413 | Payload Too Large | Arquivo muito grande (>5MB) |
| 422 | Unprocessable Entity | Dados válidos mas não processáveis |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 📝 Notas Importantes

1. **Telefones únicos**: Cada telefone só pode existir uma vez por organização
2. **Paginação**: Use `page` e `limit` para controlar a quantidade de dados
3. **Busca**: O campo `search` busca em nome, telefone, email e documento
4. **Tags**: Contatos podem ter múltiplas tags
5. **Arquivos**: Limite de 5MB para importação
6. **Formatos suportados**: XLSX, XLS, CSV para importação
7. **Permissões**: Cada endpoint verifica permissões específicas
8. **Organização**: Todos os dados são isolados por organização

---

**Documentação criada em**: 18/08/2025  
**Versão**: 1.0.0
