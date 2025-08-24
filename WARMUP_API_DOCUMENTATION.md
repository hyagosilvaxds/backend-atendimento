# 🔥 Documentação - Sistema de Aquecimento de Chips

## 🌟 Visão Geral

O Sistema de Aquecimento de Chips é uma funcionalidade avançada para simular conversações naturais com contatos, mantendo os números WhatsApp "aquecidos" e saudáveis. O sistema permite criar campanhas automatizadas que enviam mensagens de forma inteligente e controlada.

## 🎯 Funcionalidades Principais

### ✨ Recursos Implementados

- **📋 Campanhas de Aquecimento**: Criação e gerenciamento de campanhas
- **📱 Múltiplas Sessões**: Suporte a várias sessões WhatsApp por campanha
- **👥 Gerenciamento de Contatos**: Seleção de contatos específicos para aquecimento
- **💬 Templates de Mensagem**: Sistema de templates com personalização
- **📁 Arquivos de Mídia**: Upload e gerenciamento de imagens, áudios e documentos
- **⏰ Agendamento Inteligente**: Controle de horários e intervalos
- **🎲 Aleatorização**: Randomização de mensagens e intervalos
- **📊 Saúde do Número**: Cálculo automático da saúde baseado em métricas
- **📈 Estatísticas**: Relatórios detalhados de performance
- **🔄 Execução Automática**: Sistema de cron jobs para processamento

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token.

```bash
Authorization: Bearer <access_token>
```

---

## 📋 Endpoints das Campanhas

### 1. ➕ Criar Campanha

**Endpoint:** `POST /warmup/campaigns`  
**Permissão:** `CREATE_WARMUP_CAMPAIGNS`

#### Request Body
```typescript
{
  name: string;                    // Nome da campanha
  description?: string;            // Descrição opcional
  dailyMessageGoal?: number;       // Meta diária (padrão: 50)
  minIntervalMinutes?: number;     // Intervalo mínimo (padrão: 30)
  maxIntervalMinutes?: number;     // Intervalo máximo (padrão: 180)
  workingHourStart?: number;       // Hora início (padrão: 8)
  workingHourEnd?: number;         // Hora fim (padrão: 18)
  useWorkingHours?: boolean;       // Usar horário comercial (padrão: true)
  allowWeekends?: boolean;         // Permitir fins de semana (padrão: false)
  randomizeMessages?: boolean;     // Aleatorizar mensagens (padrão: true)
  randomizeInterval?: boolean;     // Aleatorizar intervalos (padrão: true)
  sessionIds?: string[];           // IDs das sessões
  contactIds?: string[];           // IDs dos contatos
}
```

#### Exemplo de Requisição
```bash
POST /warmup/campaigns
Content-Type: application/json

{
  "name": "Aquecimento Vendas",
  "description": "Campanha para aquecimento dos números de vendas",
  "dailyMessageGoal": 80,
  "minIntervalMinutes": 45,
  "maxIntervalMinutes": 120,
  "workingHourStart": 9,
  "workingHourEnd": 17,
  "useWorkingHours": true,
  "allowWeekends": false,
  "randomizeMessages": true,
  "randomizeInterval": true,
  "sessionIds": ["session_123", "session_456"],
  "contactIds": ["contact_abc", "contact_def"]
}
```

#### Resposta de Sucesso (201)
```json
{
  "id": "warmup_123",
  "name": "Aquecimento Vendas",
  "description": "Campanha para aquecimento dos números de vendas",
  "isActive": true,
  "dailyMessageGoal": 80,
  "minIntervalMinutes": 45,
  "maxIntervalMinutes": 120,
  "workingHourStart": 9,
  "workingHourEnd": 17,
  "useWorkingHours": true,
  "allowWeekends": false,
  "randomizeMessages": true,
  "randomizeInterval": true,
  "createdAt": "2025-08-18T19:30:00.000Z",
  "updatedAt": "2025-08-18T19:30:00.000Z",
  "organizationId": "org_123",
  "createdById": "user_123",
  "createdBy": {
    "id": "user_123",
    "name": "João Admin",
    "email": "joao@empresa.com"
  },
  "campaignSessions": [
    {
      "id": "camp_session_123",
      "sessionId": "session_123",
      "isActive": true,
      "healthScore": 100.0,
      "session": {
        "id": "session_123",
        "name": "WhatsApp Vendas 1",
        "phone": "5511999999999",
        "status": "CONNECTED"
      }
    }
  ],
  "campaignContacts": [
    {
      "id": "camp_contact_123",
      "contactId": "contact_abc",
      "priority": 1,
      "contact": {
        "id": "contact_abc",
        "name": "Maria Silva",
        "phone": "5511888888888"
      }
    }
  ],
  "_count": {
    "campaignSessions": 2,
    "campaignContacts": 5,
    "messageTemplates": 0,
    "executions": 0
  }
}
```

### 2. 📜 Listar Campanhas

**Endpoint:** `GET /warmup/campaigns`  
**Permissão:** `READ_WARMUP_CAMPAIGNS`

#### Resposta de Sucesso (200)
```json
[
  {
    "id": "warmup_123",
    "name": "Aquecimento Vendas",
    "description": "Campanha para aquecimento dos números de vendas",
    "isActive": true,
    "dailyMessageGoal": 80,
    "createdAt": "2025-08-18T19:30:00.000Z",
    "createdBy": {
      "id": "user_123",
      "name": "João Admin",
      "email": "joao@empresa.com"
    },
    "_count": {
      "campaignSessions": 2,
      "campaignContacts": 5,
      "messageTemplates": 3,
      "executions": 150
    }
  }
]
```

### 3. 👁️ Obter Campanha Específica

**Endpoint:** `GET /warmup/campaigns/:id`  
**Permissão:** `READ_WARMUP_CAMPAIGNS`

#### Resposta de Sucesso (200)
```json
{
  "id": "warmup_123",
  "name": "Aquecimento Vendas",
  "campaignSessions": [
    {
      "id": "camp_session_123",
      "sessionId": "session_123",
      "isActive": true,
      "healthScore": 87.5,
      "dailyMessagesSent": 45,
      "totalMessagesSent": 320,
      "session": {
        "id": "session_123",
        "name": "WhatsApp Vendas 1",
        "phone": "5511999999999",
        "status": "CONNECTED"
      },
      "healthMetrics": [
        {
          "date": "2025-08-18",
          "messagesSent": 45,
          "messagesDelivered": 43,
          "messagesRead": 38,
          "responsesReceived": 12,
          "averageMessagesPerHour": 5.6,
          "healthScore": 87.5
        }
      ]
    }
  ],
  "messageTemplates": [
    {
      "id": "template_123",
      "content": "Oi {nome}! {saudacao}, tudo bem?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    }
  ],
  "executions": [
    {
      "id": "exec_123",
      "messageContent": "Oi Maria! Bom dia, tudo bem?",
      "messageType": "text",
      "status": "delivered",
      "scheduledAt": "2025-08-18T10:30:00.000Z",
      "sentAt": "2025-08-18T10:30:15.000Z",
      "session": {
        "id": "session_123",
        "name": "WhatsApp Vendas 1"
      },
      "contact": {
        "id": "contact_abc",
        "name": "Maria Silva",
        "phone": "5511888888888"
      }
    }
  ]
}
```

### 4. ✏️ Atualizar Campanha

**Endpoint:** `PATCH /warmup/campaigns/:id`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

#### Request Body
```typescript
{
  name?: string;
  description?: string;
  dailyMessageGoal?: number;
  minIntervalMinutes?: number;
  maxIntervalMinutes?: number;
  workingHourStart?: number;
  workingHourEnd?: number;
  useWorkingHours?: boolean;
  allowWeekends?: boolean;
  randomizeMessages?: boolean;
  randomizeInterval?: boolean;
  isActive?: boolean;
}
```

### 5. 🗑️ Deletar Campanha

**Endpoint:** `DELETE /warmup/campaigns/:id`  
**Permissão:** `DELETE_WARMUP_CAMPAIGNS`

#### Resposta de Sucesso (200)
```json
{
  "message": "Campanha removida com sucesso"
}
```

---

## 📱 Gerenciamento de Sessões

### 6. ➕ Adicionar Sessões à Campanha

**Endpoint:** `POST /warmup/campaigns/:id/sessions`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

#### Request Body
```typescript
{
  sessionIds: string[];  // Array de IDs das sessões
}
```

#### Exemplo de Requisição
```bash
POST /warmup/campaigns/warmup_123/sessions
Content-Type: application/json

{
  "sessionIds": ["session_789", "session_101"]
}
```

### 7. ❌ Remover Sessão da Campanha

**Endpoint:** `DELETE /warmup/campaigns/:id/sessions/:sessionId`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

---

## 👥 Gerenciamento de Contatos

### 8. ➕ Adicionar Contatos à Campanha

**Endpoint:** `POST /warmup/campaigns/:id/contacts`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

#### Request Body
```typescript
{
  contactIds: string[];    // Array de IDs dos contatos
  priority?: number;       // Prioridade (1-5, padrão: 1)
}
```

#### Exemplo de Requisição
```bash
POST /warmup/campaigns/warmup_123/contacts
Content-Type: application/json

{
  "contactIds": ["contact_xyz", "contact_123"],
  "priority": 3
}
```

### 9. ❌ Remover Contato da Campanha

**Endpoint:** `DELETE /warmup/campaigns/:id/contacts/:contactId`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

---

## 💬 Templates de Mensagem

### 10. ➕ Criar Template

**Endpoint:** `POST /warmup/campaigns/:id/templates`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

#### Request Body
```typescript
{
  content: string;           // Conteúdo da mensagem
  messageType?: string;      // 'text', 'image', 'audio', 'document'
  weight?: number;           // Peso para seleção (1-10, padrão: 1)
  variables?: object;        // Variáveis customizadas
}
```

#### Exemplo de Requisição
```bash
POST /warmup/campaigns/warmup_123/templates
Content-Type: application/json

{
  "content": "{saudacao} {nome}! Como você está? Espero que esteja tudo bem por aí!",
  "messageType": "text",
  "weight": 5,
  "variables": {
    "customVar": "valor"
  }
}
```

#### Variáveis Disponíveis
- `{nome}`: Nome do contato
- `{telefone}`: Telefone do contato
- `{email}`: Email do contato
- `{saudacao}`: Saudação automática baseada no horário (Bom dia/Boa tarde/Boa noite)

### 11. ✏️ Atualizar Template

**Endpoint:** `PATCH /warmup/campaigns/:id/templates/:templateId`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

### 12. 🗑️ Deletar Template

**Endpoint:** `DELETE /warmup/campaigns/:id/templates/:templateId`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`

---

## 📁 Arquivos de Mídia

### 13. 📤 Upload de Arquivo

**Endpoint:** `POST /warmup/campaigns/:id/media`  
**Permissão:** `UPDATE_WARMUP_CAMPAIGNS`  
**Content-Type:** `multipart/form-data`

#### Request Body
- `file`: Arquivo de mídia (máximo 10MB)

#### Tipos Suportados
- **Imagens**: JPG, PNG, GIF, WebP
- **Áudios**: MP3, WAV, OGG
- **Vídeos**: MP4, AVI, MOV
- **Documentos**: PDF, DOC, DOCX

#### Exemplo de Requisição
```bash
POST /warmup/campaigns/warmup_123/media
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="audio.mp3"
Content-Type: audio/mpeg

[binary data]
--boundary--
```

#### Resposta de Sucesso (201)
```json
{
  "id": "media_123",
  "campaignId": "warmup_123",
  "fileName": "audio.mp3",
  "filePath": "./uploads/warmup/abc123.mp3",
  "fileType": "audio",
  "fileSize": 1024000,
  "mimeType": "audio/mpeg",
  "isActive": true,
  "createdAt": "2025-08-18T19:45:00.000Z"
}
```

---

## 📊 Estatísticas e Saúde

### 14. 📈 Estatísticas da Campanha

**Endpoint:** `GET /warmup/campaigns/:id/stats`  
**Permissão:** `READ_WARMUP_CAMPAIGNS`

#### Resposta de Sucesso (200)
```json
{
  "campaign": {
    "id": "warmup_123",
    "name": "Aquecimento Vendas",
    "isActive": true
  },
  "stats": {
    "totalExecutions": 450,
    "successfulExecutions": 425,
    "successRate": 94.4,
    "averageHealthScore": 87.3,
    "totalSessions": 3,
    "activeSessions": 3
  },
  "sessions": [
    {
      "id": "camp_session_123",
      "sessionId": "session_123",
      "sessionName": "WhatsApp Vendas 1",
      "phone": "5511999999999",
      "healthScore": 89.2,
      "dailyMessagesSent": 28,
      "totalMessagesSent": 156,
      "isActive": true,
      "lastHealthUpdate": "2025-08-18"
    }
  ]
}
```

### 15. 🔄 Calcular Saúde do Número

**Endpoint:** `POST /warmup/campaigns/:id/sessions/:sessionId/health`  
**Permissão:** `READ_WARMUP_CAMPAIGNS`

#### Resposta de Sucesso (200)
```json
{
  "campaignSessionId": "camp_session_123",
  "sessionId": "session_123",
  "healthScore": 87.5,
  "calculatedAt": "2025-08-18T19:50:00.000Z"
}
```

## 🧮 Cálculo da Saúde do Número

A saúde do número é calculada com base em múltiplas métricas dos últimos 7 dias:

### 📊 Métricas Consideradas

1. **Taxa de Entrega (30%)**: Mensagens entregues / Mensagens enviadas
2. **Taxa de Leitura (20%)**: Mensagens lidas / Mensagens entregues  
3. **Taxa de Resposta (25%)**: Respostas recebidas / Mensagens enviadas
4. **Velocidade de Envio (25%)**: Mensagens por hora (ideal: 2-8 msg/hora)

### 🎯 Pontuação
- **90-100**: Excelente 🟢
- **75-89**: Boa 🟡  
- **60-74**: Regular 🟠
- **0-59**: Ruim 🔴

---

## ⚙️ Sistema Automático

### 🔄 Processamento Automático

O sistema executa automaticamente a cada 5 minutos, verificando:

1. **Campanhas Ativas**: Apenas campanhas com `isActive: true`
2. **Horário Permitido**: Respeita configurações de horário comercial
3. **Limite Diário**: Verifica meta diária de mensagens
4. **Intervalos**: Respeita intervalos mínimos/máximos
5. **Aleatorização**: Aplica randomização quando configurada

### 📋 Fluxo de Execução

1. Buscar campanhas ativas
2. Para cada sessão da campanha:
   - Verificar limite diário
   - Verificar intervalo desde última mensagem
   - Selecionar contato aleatório (baseado em prioridade)
   - Selecionar template aleatório (baseado em peso)
   - Agendar mensagem com personalização
   - Atualizar contadores

---

## 🚨 Códigos de Erro

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| 400 | Bad Request | Dados de entrada inválidos |
| 401 | Unauthorized | Token inválido ou expirado |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Campanha/Template não encontrado |
| 409 | Conflict | Sessão já adicionada à campanha |
| 413 | Payload Too Large | Arquivo muito grande (>10MB) |
| 422 | Unprocessable Entity | Arquivo de tipo não suportado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 💡 Exemplos de Uso

### 🎯 Cenário 1: Campanha Básica

```bash
# 1. Criar campanha simples
POST /warmup/campaigns
{
  "name": "Aquecimento Básico",
  "dailyMessageGoal": 30,
  "sessionIds": ["session_123"],
  "contactIds": ["contact_abc", "contact_def"]
}

# 2. Adicionar templates
POST /warmup/campaigns/{id}/templates
{
  "content": "Oi {nome}! {saudacao}, tudo bem?",
  "weight": 3
}

POST /warmup/campaigns/{id}/templates
{
  "content": "E aí {nome}! Como está o seu dia?",
  "weight": 2
}
```

### 🎯 Cenário 2: Campanha Avançada

```bash
# 1. Criar campanha com configurações avançadas
POST /warmup/campaigns
{
  "name": "Aquecimento VIP",
  "description": "Aquecimento para clientes VIP",
  "dailyMessageGoal": 60,
  "minIntervalMinutes": 60,
  "maxIntervalMinutes": 240,
  "workingHourStart": 9,
  "workingHourEnd": 18,
  "allowWeekends": false,
  "randomizeMessages": true,
  "randomizeInterval": true,
  "sessionIds": ["session_123", "session_456"],
  "contactIds": ["contact_vip1", "contact_vip2"]
}

# 2. Upload de arquivo de áudio
POST /warmup/campaigns/{id}/media
Content-Type: multipart/form-data
[audio file]

# 3. Verificar estatísticas
GET /warmup/campaigns/{id}/stats
```

---

## 📝 Notas Importantes

1. **🔄 Processamento**: O sistema processa automaticamente a cada 5 minutos
2. **⏰ Horários**: Respeita configurações de horário comercial e fins de semana
3. **🎲 Aleatorização**: Mensagens e intervalos podem ser randomizados
4. **📊 Saúde**: Cálculo automático baseado em múltiplas métricas
5. **🔒 Permissões**: Sistema completo de controle de acesso
6. **📁 Arquivos**: Suporte a múltiplos tipos de mídia
7. **🏷️ Variáveis**: Sistema de personalização de mensagens
8. **📈 Métricas**: Coleta automática de dados para análise

---

**Documentação criada em**: 18/08/2025  
**Versão**: 1.0.0  
**Sistema**: Aquecimento de Chips WhatsApp
