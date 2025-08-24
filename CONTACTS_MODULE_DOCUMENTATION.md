# Módulo de Contatos - API Documentation

Este documento descreve o módulo completo de contatos com funcionalidades de CRUD, importação e exportação via Excel.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Modelos de Dados](#modelos-de-dados)
- [Endpoints da API](#endpoints-da-api)
- [Importação e Exportação](#importação-e-exportação)
- [Sistema de Tags](#sistema-de-tags)
- [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

O módulo de contatos oferece:

- ✅ CRUD completo de contatos
- ✅ Sistema de tags para categorização
- ✅ Importação via Excel/CSV
- ✅ Exportação em Excel
- ✅ Template para importação
- ✅ Busca e filtros avançados
- ✅ Paginação
- ✅ Validações de dados
- ✅ Controle de permissões

## 📊 Modelos de Dados

### Contact
```typescript
{
  id: string;
  name: string;              // Nome (obrigatório)
  phone?: string;            // Telefone
  email?: string;            // Email
  document?: string;         // CPF/CNPJ
  birthDate?: Date;          // Data de nascimento
  address?: string;          // Endereço
  city?: string;             // Cidade
  state?: string;            // Estado
  zipCode?: string;          // CEP
  notes?: string;            // Observações
  isActive: boolean;         // Status ativo/inativo
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
  organizationId: string;    // ID da organização
  createdById: string;       // ID do usuário criador
  tags: Tag[];               // Tags associadas
}
```

### Tag
```typescript
{
  id: string;
  name: string;              // Nome da tag (obrigatório)
  color?: string;            // Cor em hex (#FF0000)
  description?: string;      // Descrição
  organizationId: string;    // ID da organização
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
}
```

## 🚀 Endpoints da API

### Contatos

#### `GET /contacts`
Lista contatos com filtros e paginação.

**Query Parameters:**
- `search` - Busca por nome, telefone, email ou documento
- `tagId` - Filtrar por tag específica
- `isActive` - Filtrar por status (true/false)
- `page` - Página (default: 1)
- `limit` - Itens por página (default: 10)
- `sortBy` - Campo para ordenação (name, phone, email, createdAt)
- `sortOrder` - Ordem (asc, desc)

**Exemplo:**
```bash
GET /contacts?search=João&page=1&limit=20&sortBy=name&sortOrder=asc
```

#### `POST /contacts`
Cria um novo contato.

**Body:**
```json
{
  "name": "João Silva",
  "phone": "11999999999",
  "email": "joao@email.com",
  "document": "123.456.789-00",
  "birthDate": "1990-01-01",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234567",
  "notes": "Cliente VIP",
  "isActive": true,
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

#### `GET /contacts/:id`
Obtém um contato específico com todas as informações.

#### `PUT /contacts/:id`
Atualiza um contato existente.

#### `DELETE /contacts/:id`
Remove um contato.

#### `POST /contacts/:id/tags/:tagId`
Adiciona uma tag a um contato.

#### `DELETE /contacts/:id/tags/:tagId`
Remove uma tag de um contato.

### Tags

#### `GET /contacts/tags/list`
Lista todas as tags da organização.

#### `POST /contacts/tags`
Cria uma nova tag.

**Body:**
```json
{
  "name": "Cliente VIP",
  "color": "#FF5733",
  "description": "Clientes prioritários"
}
```

#### `GET /contacts/tags/:id`
Obtém uma tag específica.

#### `PUT /contacts/tags/:id`
Atualiza uma tag.

#### `DELETE /contacts/tags/:id`
Remove uma tag.

#### `GET /contacts/tags/:id/contacts`
Lista contatos de uma tag específica.

## 📥📤 Importação e Exportação

### Template de Importação

#### `GET /contacts/template`
Baixa o template Excel para importação de contatos.

O template inclui:
- Aba com campos e exemplo
- Aba com instruções detalhadas
- Validações de formato

### Importação

#### `POST /contacts/import`
Importa contatos via arquivo Excel.

**Multipart Form:**
- `file` - Arquivo Excel (.xlsx, .xls) até 5MB

**Resposta:**
```json
{
  "success": 15,
  "duplicates": 2,
  "errors": [
    {
      "line": 5,
      "contact": {...},
      "error": "Email inválido"
    }
  ]
}
```

#### `POST /contacts/import/json`
Importa contatos via JSON.

**Body:**
```json
{
  "contacts": [
    {
      "name": "Contato 1",
      "phone": "11999999999",
      // ... outros campos
    }
  ]
}
```

### Exportação

#### `POST /contacts/export`
Exporta contatos em Excel.

**Body:**
```json
{
  "format": "xlsx",
  "fields": ["name", "phone", "email"],
  "contactIds": ["id1", "id2"],
  "tagId": "tag-id",
  "search": "termo de busca"
}
```

**Parâmetros:**
- `format` - Formato do arquivo (xlsx)
- `fields` - Campos específicos para exportar
- `contactIds` - IDs específicos de contatos
- `tagId` - Exportar apenas contatos de uma tag
- `search` - Filtro de busca

## 🏷️ Sistema de Tags

As tags permitem categorizar e organizar contatos:

- Cada organização tem suas próprias tags
- Tags podem ter cores personalizadas
- Um contato pode ter múltiplas tags
- Filtros e buscas por tags
- Relatórios por categorias

## 💡 Exemplos de Uso

### 1. Criar um contato completo
```bash
curl -X POST "http://localhost:4000/contacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "phone": "11987654321",
    "email": "maria@empresa.com",
    "document": "987.654.321-00",
    "birthDate": "1985-05-15",
    "city": "São Paulo",
    "state": "SP",
    "notes": "Cliente desde 2020"
  }'
```

### 2. Buscar contatos
```bash
curl -X GET "http://localhost:4000/contacts?search=Maria&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Criar uma tag
```bash
curl -X POST "http://localhost:4000/contacts/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente Premium",
    "color": "#FFD700",
    "description": "Clientes com plano premium"
  }'
```

### 4. Baixar template de importação
```bash
curl -X GET "http://localhost:4000/contacts/template" \
  -H "Authorization: Bearer $TOKEN" \
  -o template-contatos.xlsx
```

### 5. Importar contatos
```bash
curl -X POST "http://localhost:4000/contacts/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@meus-contatos.xlsx"
```

### 6. Exportar contatos
```bash
curl -X POST "http://localhost:4000/contacts/export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "xlsx",
    "fields": ["name", "phone", "email", "tags"]
  }' \
  -o contatos-exportados.xlsx
```

## 🔒 Permissões Necessárias

- `READ_CONTACTS` - Visualizar contatos
- `CREATE_CONTACTS` - Criar contatos e tags
- `UPDATE_CONTACTS` - Editar contatos e tags
- `DELETE_CONTACTS` - Remover contatos e tags
- `MANAGE_CONTACTS` - Importar/exportar contatos

## 📝 Validações

### Contato
- Nome é obrigatório
- Telefone único por organização (se fornecido)
- Email deve ter formato válido
- Data de nascimento deve ser válida
- CEP deve conter apenas números

### Tag
- Nome é obrigatório e único por organização
- Cor deve estar em formato hexadecimal (#RRGGBB)

## 🚨 Tratamento de Erros

- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (telefone duplicado)
- `413 Payload Too Large` - Arquivo muito grande
- `415 Unsupported Media Type` - Tipo de arquivo inválido

## 📈 Performance

- Paginação padrão: 10 itens
- Máximo por página: 100 itens
- Arquivo de importação: máximo 5MB
- Índices no banco para campos de busca
- Cache de consultas frequentes

---

## 🎉 Recursos Implementados

✅ **CRUD Completo de Contatos**
- Criar, ler, atualizar e deletar contatos
- Validações completas de dados
- Relacionamento com organização e usuário criador

✅ **Sistema de Tags**
- Criar e gerenciar tags coloridas
- Associar múltiplas tags aos contatos
- Filtrar contatos por tags

✅ **Importação Excel/CSV**
- Template personalizado com instruções
- Validação de dados durante importação
- Relatório de erros e duplicatas
- Suporte a múltiplos formatos de data

✅ **Exportação Excel**
- Exportação com filtros personalizados
- Seleção de campos específicos
- Formatação profissional

✅ **Busca e Filtros**
- Busca textual em múltiplos campos
- Filtros por tag, status, etc.
- Ordenação personalizada
- Paginação eficiente

✅ **Segurança e Permissões**
- Integração com sistema de permissões
- Isolamento por organização
- Validação de entrada rigorosa

Este módulo oferece uma solução completa para gerenciamento de contatos com todas as funcionalidades modernas esperadas em um sistema profissional.
