# 📞 Módulo de Contatos - Sistema de Atendimento

## 📋 Visão Geral

Este módulo implementa um sistema completo de gerenciamento de contatos com funcionalidades de CRUD, sistema de tags, importação/exportação via Excel e controle de permissões.

## 🚀 Funcionalidades Principais

### ✅ CRUD Completo
- **Criar** contatos com validações de negócio
- **Listar** com busca, filtros e paginação
- **Atualizar** informações dos contatos
- **Deletar** contatos (soft delete opcional)

### 🏷️ Sistema de Tags
- Criação e gerenciamento de tags coloridas
- Associação múltipla de tags por contato
- Filtragem de contatos por tags

### 📊 Importação/Exportação
- **Template Excel** para importação padronizada
- **Importação** via arquivo Excel/CSV ou JSON
- **Exportação** de contatos para Excel
- Validação e relatório de erros na importação

### 🔍 Busca e Filtragem
- Busca textual em nome, telefone, email e documento
- Filtros por status (ativo/inativo) e tags
- Paginação e ordenação personalizáveis

## 📁 Estrutura de Arquivos

```
src/contacts/
├── contacts.controller.ts      # Endpoints e validações
├── contacts.service.ts         # Lógica de negócio principal
├── tags.service.ts            # Gerenciamento de tags
├── contacts.module.ts         # Configuração do módulo
└── dto/
    ├── create-contact.dto.ts   # Validação para criação
    ├── update-contact.dto.ts   # Validação para atualização
    ├── query-contacts.dto.ts   # Parâmetros de consulta
    ├── import-contacts.dto.ts  # Estrutura de importação
    ├── export-contacts.dto.ts  # Parâmetros de exportação
    ├── create-tag.dto.ts       # Criação de tags
    └── update-tag.dto.ts       # Atualização de tags
```

## 🔐 Controle de Permissões

O módulo implementa controle granular de permissões:

- `READ_CONTACTS`: Visualizar contatos
- `CREATE_CONTACTS`: Criar novos contatos  
- `UPDATE_CONTACTS`: Editar contatos existentes
- `DELETE_CONTACTS`: Remover contatos
- `MANAGE_CONTACTS`: Acesso completo + importação
- `READ_TAGS`: Visualizar tags
- `MANAGE_TAGS`: Gerenciar tags

## 📊 Campos do Contato

### Obrigatórios
- `name`: Nome completo
- `phone`: Telefone (único por organização)

### Opcionais
- `email`: Email de contato
- `document`: CPF/CNPJ
- `birthDate`: Data de nascimento
- `address`, `city`, `state`, `zipCode`: Dados de endereço
- `notes`: Observações gerais
- `isActive`: Status do contato

### Automáticos
- `id`: Identificador único
- `createdAt`, `updatedAt`: Timestamps
- `organizationId`: Isolamento por organização
- `createdById`: Rastreabilidade

## 🛠️ Tecnologias Utilizadas

- **NestJS**: Framework principal
- **Prisma**: ORM para banco de dados
- **class-validator**: Validação de DTOs
- **xlsx**: Manipulação de arquivos Excel
- **multer**: Upload de arquivos

## 📈 Validações Implementadas

1. **Telefone único** por organização
2. **Formato de email** válido
3. **Tamanho de arquivo** (máx. 5MB para importação)
4. **Tipos de arquivo** suportados (xlsx, xls, csv)
5. **Campos obrigatórios** conforme regras de negócio
6. **Permissões** por endpoint

## 🔗 Links Relacionados

- [📖 Documentação Completa de Endpoints](./CONTACTS_API_DOCUMENTATION.md)
- [📋 Resumo da Implementação](./CONTACTS_API_SUMMARY.md)
- [🔐 Sistema de Permissões](./PERMISSIONS_DOCUMENTATION.md)

## 📝 Exemplos de Uso

### Criar Contato
```bash
POST /contacts
{
  "name": "João Silva",
  "phone": "11999999999", 
  "email": "joao@email.com",
  "tags": ["VIP"]
}
```

### Buscar Contatos
```bash
GET /contacts?search=João&limit=10&page=1
```

### Exportar para Excel
```bash
GET /contacts/export
```

---

**Status**: ✅ Implementado e Testado  
**Última Atualização**: 18/08/2025
