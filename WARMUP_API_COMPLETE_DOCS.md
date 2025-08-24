# 🔥 API de Campanhas de Aquecimento - Documentação Completa

## Visão Geral

A API de Warmup (Aquecimento) permite gerenciar campanhas de aquecimento de números WhatsApp com suporte a **múltiplas sessões** e **conversas internas**. O sistema simula conversas naturais tanto entre diferentes sessões da mesma campanha quanto com contatos externos, melhorando a reputação dos números e reduzindo o risco de bloqueios.

### ✨ Novidades - Conversas Internas
- **Múltiplas Sessões**: Uma campanha pode incluir várias sessões WhatsApp
- **Conversas Internas**: Sessões conversam entre si automaticamente
- **Proporção Configurável**: Controle a mistura entre conversas internas e externas
- **Aquecimento Natural**: Simula interações reais entre números conhecidos

**Base URL:** `http://localhost:4000/warmup`

**Autenticação:** Bearer Token JWT

**Permissões Necessárias:** `WARMUP_CAMPAIGNS` (read/write/delete)

---

## 📋 Endpoints Principais

### 1. Listar Campanhas de Aquecimento

**Endpoint:** `GET /warmup/campaigns`

**Descrição:** Lista todas as campanhas de aquecimento da organização

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Query Parameters:**
```
status?: string       # Filtrar por status (active, paused, completed)
sessionId?: string    # Filtrar por sessão WhatsApp
page?: number         # Página (padrão: 1)
limit?: number        # Itens por página (padrão: 10)
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "campaign_123",
      "name": "Aquecimento Multi-Sessão",
      "description": "Campanha com múltiplas sessões e conversas internas",
      "isActive": true,
      "dailyMessageGoal": 50,
      "minIntervalMinutes": 15,
      "maxIntervalMinutes": 45,
      "enableInternalConversations": true,
      "internalConversationRatio": 0.3,
      "useWorkingHours": true,
      "workingHourStart": 8,
      "workingHourEnd": 18,
      "allowWeekends": false,
      "randomizeInterval": true,
      "createdAt": "2025-08-18T10:00:00Z",
      "updatedAt": "2025-08-18T15:30:00Z",
      "campaignSessions": [
        {
          "id": "cs_001",
          "sessionId": "session_456",
          "session": {
            "id": "session_456",
            "name": "WhatsApp Principal",
            "phone": "+5511999999999",
            "status": "connected"
          },
          "healthScore": 85.5,
          "dailyMessagesSent": 15,
          "totalMessagesSent": 125,
          "isActive": true
        },
        {
          "id": "cs_002", 
          "sessionId": "session_789",
          "session": {
            "id": "session_789",
            "name": "WhatsApp Vendas",
            "phone": "+5511888888888",
            "status": "connected"
          },
          "healthScore": 92.1,
          "dailyMessagesSent": 12,
          "totalMessagesSent": 98,
          "isActive": true
        }
      ],
      "_count": {
        "campaignSessions": 2,
        "campaignContacts": 150,
        "messageTemplates": 10,
        "executions": 225
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 2. Criar Nova Campanha

**Endpoint:** `POST /warmup/campaigns`

**Descrição:** Cria uma nova campanha de aquecimento

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Aquecimento Multi-Sessão Vendas",
  "description": "Campanha com múltiplas sessões conversando entre si",
  "dailyMessageGoal": 40,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "minIntervalMinutes": 20,
  "maxIntervalMinutes": 60,
  "useWorkingHours": true,
  "workingHourStart": 9,
  "workingHourEnd": 17,
  "allowWeekends": false,
  "randomizeInterval": true,
  "sessionIds": ["session_456", "session_789", "session_101"],
  "contactIds": ["contact_1", "contact_2", "contact_3"]
}
```

**Campos Obrigatórios:**
- `name`: Nome da campanha
- `dailyMessageGoal`: Meta diária de mensagens (1-100)

**Campos Opcionais:**
- `description`: Descrição da campanha
- `enableInternalConversations`: Habilita conversas entre sessões (padrão: false)
- `internalConversationRatio`: Proporção de conversas internas 0.0-1.0 (padrão: 0.2)
- `minIntervalMinutes`: Intervalo mínimo entre mensagens em minutos (5-120, padrão: 15)
- `maxIntervalMinutes`: Intervalo máximo entre mensagens em minutos (10-180, padrão: 45)
- `useWorkingHours`: Se deve respeitar horário comercial (padrão: true)
- `workingHourStart`: Horário de início 0-23 (padrão: 8)
- `workingHourEnd`: Horário de término 0-23 (padrão: 18)
- `allowWeekends`: Se permite envios nos fins de semana (padrão: false)
- `randomizeInterval`: Se deve randomizar intervalos (padrão: true)
- `sessionIds`: IDs das sessões WhatsApp para incluir
- `contactIds`: IDs dos contatos para incluir

**Resposta de Sucesso (201):**
```json
{
  "id": "campaign_789",
  "name": "Aquecimento Multi-Sessão Vendas",
  "description": "Campanha com múltiplas sessões conversando entre si",
  "isActive": true,
  "dailyMessageGoal": 40,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "minIntervalMinutes": 20,
  "maxIntervalMinutes": 60,
  "useWorkingHours": true,
  "workingHourStart": 9,
  "workingHourEnd": 17,
  "allowWeekends": false,
  "randomizeInterval": true,
  "createdAt": "2025-08-18T16:00:00Z",
  "updatedAt": "2025-08-18T16:00:00Z",
  "organizationId": "org_123",
  "createdById": "user_456",
  "campaignSessions": [
    {
      "sessionId": "session_456",
      "session": {
        "name": "WhatsApp Principal",
        "phone": "+5511999999999"
      },
      "healthScore": 100.0,
      "dailyMessagesSent": 0,
      "totalMessagesSent": 0,
      "isActive": true
    },
    {
      "sessionId": "session_789", 
      "session": {
        "name": "WhatsApp Vendas",
        "phone": "+5511888888888"
      },
      "healthScore": 100.0,
      "dailyMessagesSent": 0,
      "totalMessagesSent": 0,
      "isActive": true
    }
  ]
}
```

**Erros Possíveis:**
```json
// 400 - Bad Request
{
  "statusCode": 400,
  "message": [
    "dailyMessageGoal must be between 1 and 100",
    "internalConversationRatio must be between 0 and 1",
    "sessionIds must contain at least one valid session ID"
  ],
  "error": "Bad Request"
}

// 404 - Not Found
{
  "statusCode": 404,
  "message": "One or more sessions not found",
  "error": "Not Found"
}

// 409 - Conflict
{
  "statusCode": 409,
  "message": "One or more sessions already have active campaigns",
  "error": "Conflict"
}

// 422 - Unprocessable Entity
{
  "statusCode": 422,
  "message": "Internal conversations require at least 2 sessions",
  "error": "Unprocessable Entity"
}
```

---

### 3. Obter Detalhes da Campanha

**Endpoint:** `GET /warmup/campaigns/{id}`

**Descrição:** Obtém detalhes completos de uma campanha específica

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "campaign_123",
  "name": "Aquecimento Multi-Sessão",
  "description": "Campanha com múltiplas sessões e conversas internas",
  "isActive": true,
  "dailyMessageGoal": 50,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.3,
  "minIntervalMinutes": 15,
  "maxIntervalMinutes": 45,
  "useWorkingHours": true,
  "workingHourStart": 8,
  "workingHourEnd": 18,
  "allowWeekends": false,
  "randomizeInterval": true,
  "createdAt": "2025-08-18T10:00:00Z",
  "updatedAt": "2025-08-18T15:30:00Z",
  "campaignSessions": [
    {
      "id": "cs_001",
      "sessionId": "session_456",
      "session": {
        "id": "session_456",
        "name": "WhatsApp Principal",
        "phone": "+5511999999999",
        "status": "connected"
      },
      "healthScore": 85.5,
      "dailyMessagesSent": 15,
      "totalMessagesSent": 125,
      "isActive": true,
      "lastMessageAt": "2025-08-18T14:30:00Z"
    },
    {
      "id": "cs_002",
      "sessionId": "session_789", 
      "session": {
        "id": "session_789",
        "name": "WhatsApp Vendas",
        "phone": "+5511888888888",
        "status": "connected"
      },
      "healthScore": 92.1,
      "dailyMessagesSent": 12,
      "totalMessagesSent": 98,
      "isActive": true,
      "lastMessageAt": "2025-08-18T14:15:00Z"
    }
  ],
  "campaignContacts": [
    {
      "id": "cc_001",
      "contactId": "contact_1",
      "contact": {
        "id": "contact_1",
        "name": "João Silva",
        "phone": "+5511888888888"
      },
      "priority": 1,
      "isActive": true
    }
  ],
  "messageTemplates": [
    {
      "id": "template_1",
      "name": "Saudação Casual",
      "content": "Oi {nome}! {saudacao}, como vai?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    }
  ],
  "executions": [
    {
      "id": "exec_001",
      "executionType": "internal",
      "fromSessionId": "session_456",
      "toSessionId": "session_789",
      "messageContent": "Oi WhatsApp Vendas! Bom dia, como vai?",
      "messageType": "text",
      "status": "delivered",
      "scheduledAt": "2025-08-18T14:00:00Z",
      "sentAt": "2025-08-18T14:00:15Z"
    },
    {
      "id": "exec_002", 
      "executionType": "external",
      "fromSessionId": "session_456",
      "contactId": "contact_1",
      "messageContent": "Oi João Silva! Bom dia, como vai?",
      "messageType": "text",
      "status": "read",
      "scheduledAt": "2025-08-18T14:30:00Z",
      "sentAt": "2025-08-18T14:30:10Z"
    }
  ],
  "statistics": {
    "totalExecutions": 125,
    "internalExecutions": 38,
    "externalExecutions": 87,
    "successfulSends": 120,
    "failedSends": 5,
    "todaysSends": 25,
    "avgResponseTime": 3600,
    "healthTrend": "increasing"
  }
}
```

---

### 4. Atualizar Campanha

**Endpoint:** `PATCH /warmup/campaigns/{id}`

**Descrição:** Atualiza uma campanha existente

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Novo Nome da Campanha",
  "description": "Nova descrição",
  "dailyMessageGoal": 40,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.5,
  "minIntervalMinutes": 10,
  "maxIntervalMinutes": 30,
  "useWorkingHours": false,
  "workingHourStart": 7,
  "workingHourEnd": 19,
  "allowWeekends": true,
  "randomizeInterval": false,
  "isActive": false
}
```

**Campos Atualizáveis:**
- `name`, `description`
- `dailyMessageGoal`, `minIntervalMinutes`, `maxIntervalMinutes`
- `enableInternalConversations`, `internalConversationRatio`
- `useWorkingHours`, `workingHourStart`, `workingHourEnd`
- `allowWeekends`, `randomizeInterval`
- `isActive`: true | false

**Resposta de Sucesso (200):**
```json
{
  "id": "campaign_123",
  "name": "Novo Nome da Campanha",
  "status": "paused",
  "updatedAt": "2025-08-18T16:30:00Z"
  // ... outros campos atualizados
}
```

---

### 5. Excluir Campanha

**Endpoint:** `DELETE /warmup/campaigns/{id}`

**Descrição:** Exclui uma campanha (soft delete)

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Campaign deleted successfully",
  "deletedAt": "2025-08-18T16:45:00Z"
}
```

---

## � Gerenciamento de Sessões Múltiplas

### 6. Adicionar Sessões à Campanha

**Endpoint:** `POST /warmup/campaigns/{campaignId}/sessions`

**Descrição:** Adiciona uma ou mais sessões WhatsApp a uma campanha existente

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Payload:**
```json
{
  "sessionIds": ["session_new1", "session_new2"]
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "2 sessions added to campaign successfully",
  "data": [
    {
      "id": "cs_new1",
      "campaignId": "campaign_123",
      "sessionId": "session_new1",
      "session": {
        "name": "WhatsApp Suporte",
        "phone": "+5511777777777"
      },
      "healthScore": 100.0,
      "dailyMessagesSent": 0,
      "isActive": true
    }
  ]
}
```

### 7. Remover Sessão da Campanha

**Endpoint:** `DELETE /warmup/campaigns/{campaignId}/sessions/{sessionId}`

**Descrição:** Remove uma sessão específica da campanha

**Resposta de Sucesso (200):**
```json
{
  "message": "Session removed from campaign successfully"
}
```

### 8. Listar Sessões da Campanha

**Endpoint:** `GET /warmup/campaigns/{campaignId}/sessions`

**Descrição:** Lista todas as sessões de uma campanha com suas métricas

**Query Parameters:**
```
status?: string    # Filtrar por status (active, inactive)
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "cs_001",
      "sessionId": "session_456",
      "session": {
        "id": "session_456",
        "name": "WhatsApp Principal",
        "phone": "+5511999999999",
        "status": "connected"
      },
      "healthScore": 85.5,
      "dailyMessagesSent": 15,
      "totalMessagesSent": 125,
      "lastMessageAt": "2025-08-18T14:30:00Z",
      "isActive": true,
      "healthMetrics": [
        {
          "date": "2025-08-18",
          "messagesSent": 15,
          "messagesDelivered": 14,
          "messagesRead": 12,
          "responsesReceived": 8,
          "averageMessagesPerHour": 3.2
        }
      ]
    }
  ],
  "summary": {
    "totalSessions": 3,
    "activeSessions": 3,
    "averageHealthScore": 87.3,
    "totalDailyMessages": 42,
    "internalConversationsToday": 12
  }
}
```

---

## 💬 Conversas Internas

### 9. Estatísticas de Conversas Internas

**Endpoint:** `GET /warmup/campaigns/{campaignId}/internal-conversations`

**Descrição:** Obtém estatísticas específicas das conversas internas entre sessões

**Query Parameters:**
```
period?: string    # "today", "week", "month" (padrão: "today")
```

**Resposta de Sucesso (200):**
```json
{
  "period": "today",
  "summary": {
    "totalInternalExecutions": 12,
    "totalExternalExecutions": 28,
    "internalRatio": 0.3,
    "configuredRatio": 0.3,
    "successRate": 100.0
  },
  "sessionPairs": [
    {
      "fromSession": {
        "id": "session_456",
        "name": "WhatsApp Principal"
      },
      "toSession": {
        "id": "session_789", 
        "name": "WhatsApp Vendas"
      },
      "conversationCount": 4,
      "lastConversation": "2025-08-18T15:45:00Z",
      "averageInterval": 2400
    }
  ],
  "recentConversations": [
    {
      "id": "exec_internal_001",
      "fromSessionName": "WhatsApp Principal",
      "toSessionName": "WhatsApp Vendas",
      "messageContent": "Oi WhatsApp Vendas! Boa tarde, como estão as vendas hoje?",
      "status": "delivered",
      "sentAt": "2025-08-18T15:45:00Z"
    }
  ]
}
```

### 10. Forçar Conversa Interna

**Endpoint:** `POST /warmup/campaigns/{campaignId}/internal-conversations/execute`

**Descrição:** Força uma conversa interna entre duas sessões específicas

**Payload:**
```json
{
  "fromSessionId": "session_456",
  "toSessionId": "session_789",
  "templateId": "template_1"  // Opcional
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Internal conversation scheduled successfully",
  "execution": {
    "id": "exec_forced_001",
    "executionType": "internal",
    "fromSessionId": "session_456",
    "toSessionId": "session_789",
    "messageContent": "Oi WhatsApp Vendas! Bom dia, como vai?",
    "status": "scheduled",
    "scheduledAt": "2025-08-18T16:00:00Z"
  }
}
```

---

## �📝 Gerenciamento de Templates

### 11. Listar Templates

**Endpoint:** `GET /warmup/campaigns/{campaignId}/templates`

**Query Parameters:**
```
type?: string    # Filtrar por tipo (text, image, audio, video, document)
active?: boolean # Filtrar por templates ativos
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "template_1",
      "name": "Saudação Casual",
      "content": "Oi {nome}! {saudacao}, como você está?",
      "messageType": "text",
      "weight": 3,
      "isActive": true,
      "usageCount": 15,
      "internalUsage": 6,
      "externalUsage": 9,
      "createdAt": "2025-08-18T10:00:00Z"
    },
    {
      "id": "template_2",
      "name": "Imagem Motivacional",
      "content": "Olha essa imagem inspiradora, {nome}!",
      "messageType": "image",
      "mediaUrl": "/uploads/warmup/motivation_123.jpg",
      "weight": 2,
      "isActive": true,
      "usageCount": 8,
      "internalUsage": 3,
      "externalUsage": 5,
      "createdAt": "2025-08-18T11:00:00Z"
    }
  ],
  "summary": {
    "totalTemplates": 10,
    "activeTemplates": 8,
    "textTemplates": 6,
    "mediaTemplates": 4,
    "totalUsage": 145,
    "internalUsage": 45,
    "externalUsage": 100
  }
}
```

### 12. Criar Template

**Endpoint:** `POST /warmup/campaigns/{campaignId}/templates`

**Content-Type:** `multipart/form-data`

**Payload:**
```
name: "Template Personalizado"
content: "Olá {nome}! {saudacao}, tudo bem por aí?"
messageType: "text"
weight: 3
isActive: true
file: [arquivo opcional para mídia]
```

**Campos:**
- `name`: Nome do template (obrigatório)
- `content`: Conteúdo da mensagem com variáveis (obrigatório)
- `messageType`: Tipo de mensagem (obrigatório)
- `weight`: Peso para seleção aleatória 1-10 (padrão: 1)
- `isActive`: Se o template está ativo (padrão: true)

**Variáveis Disponíveis:**
- `{nome}`: Nome do contato ou sessão de destino
- `{telefone}`: Telefone do contato ou sessão
- `{saudacao}`: Saudação automática baseada no horário

**Tipos de Mídia Suportados:**
- `text`: Apenas texto
- `image`: Imagem (JPG, PNG, GIF - máx 10MB)
- `audio`: Áudio (MP3, OGG, AAC - máx 10MB)
- `video`: Vídeo (MP4, AVI - máx 10MB)
- `document`: Documento (PDF, DOC, DOCX - máx 10MB)

**Resposta de Sucesso (201):**
```json
{
  "id": "template_new",
  "name": "Template Personalizado",
  "content": "Olá {nome}! {saudacao}, tudo bem por aí?",
  "messageType": "text",
  "mediaUrl": null,
  "weight": 3,
  "isActive": true,
  "campaignId": "campaign_123",
  "createdAt": "2025-08-18T16:50:00Z"
}
```

---

## 👥 Gerenciamento de Contatos

### 13. Listar Contatos da Campanha

**Endpoint:** `GET /warmup/campaigns/{campaignId}/contacts`

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "contact_1",
      "name": "João Silva",
      "phone": "+5511888888888",
      "lastInteraction": "2025-08-18T14:30:00Z",
      "interactionCount": 5,
      "averageResponseTime": 3600
    }
  ]
}
```

### 14. Adicionar Contatos

**Endpoint:** `POST /warmup/campaigns/{campaignId}/contacts`

**Payload:**
```json
{
  "contactIds": ["contact_1", "contact_2", "contact_3"],
  "priority": 1
}
```

**Campos:**
- `contactIds`: IDs dos contatos a adicionar (obrigatório)
- `priority`: Prioridade dos contatos 1-10 (padrão: 1)
```

**Resposta de Sucesso (200):**
```json
{
  "message": "3 contacts added to campaign",
  "addedContacts": ["contact_1", "contact_2", "contact_3"]
}
```

---

## 📊 Estatísticas e Relatórios

### 15. Estatísticas da Campanha

**Endpoint:** `GET /warmup/campaigns/{campaignId}/statistics`

**Query Parameters:**
```
period?: string    # "today", "week", "month" (padrão: "today")
```

**Resposta de Sucesso (200):**
```json
{
  "period": "today",
  "campaignId": "campaign_123",
  "summary": {
    "totalExecutions": 25,
    "internalExecutions": 8,
    "externalExecutions": 17,
    "successfulSends": 24,
    "failedSends": 1,
    "responseRate": 0.8,
    "averageResponseTime": 3600,
    "internalConversationRatio": 0.32,
    "configuredRatio": 0.3,
    "goalProgress": {
      "current": 25,
      "target": 50,
      "percentage": 50
    }
  },
  "sessionStats": [
    {
      "sessionId": "session_456",
      "sessionName": "WhatsApp Principal",
      "healthScore": 85.5,
      "dailyMessagesSent": 15,
      "internalSent": 5,
      "externalSent": 10,
      "successRate": 96.7
    },
    {
      "sessionId": "session_789",
      "sessionName": "WhatsApp Vendas", 
      "healthScore": 92.1,
      "dailyMessagesSent": 10,
      "internalSent": 3,
      "externalSent": 7,
      "successRate": 100.0
    }
  ],
  "hourlyDistribution": [
    { 
      "hour": "08:00", 
      "total": 3, 
      "internal": 1, 
      "external": 2,
      "responses": 2 
    },
    { 
      "hour": "09:00", 
      "total": 4, 
      "internal": 2, 
      "external": 2,
      "responses": 3 
    }
  ],
  "healthMetrics": {
    "averageHealthScore": 88.8,
    "responseRate": 80,
    "messageDeliveryRate": 96,
    "errorRate": 4,
    "internalConversationSuccess": 100
  }
}
```

### 16. Histórico de Execuções

**Endpoint:** `GET /warmup/campaigns/{campaignId}/executions`

**Query Parameters:**
```
status?: string         # "scheduled", "sent", "delivered", "failed"
executionType?: string  # "internal", "external"
fromSessionId?: string  # Filtrar por sessão remetente
toSessionId?: string    # Filtrar por sessão destinatária (conversas internas)
startDate?: string      # ISO date
endDate?: string        # ISO date
page?: number
limit?: number
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "exec_123",
      "executionType": "internal",
      "status": "delivered",
      "scheduledAt": "2025-08-18T10:00:00Z",
      "sentAt": "2025-08-18T10:00:15Z",
      "deliveredAt": "2025-08-18T10:00:20Z",
      "fromSession": {
        "id": "session_456",
        "name": "WhatsApp Principal",
        "phone": "+5511999999999"
      },
      "toSession": {
        "id": "session_789",
        "name": "WhatsApp Vendas", 
        "phone": "+5511888888888"
      },
      "template": {
        "id": "template_1",
        "name": "Saudação Casual",
        "content": "Oi {nome}! {saudacao}, como vai?"
      },
      "messageContent": "Oi WhatsApp Vendas! Bom dia, como vai?",
      "error": null
    },
    {
      "id": "exec_124",
      "executionType": "external", 
      "status": "read",
      "scheduledAt": "2025-08-18T10:30:00Z",
      "sentAt": "2025-08-18T10:30:12Z",
      "deliveredAt": "2025-08-18T10:30:18Z",
      "readAt": "2025-08-18T10:45:30Z",
      "fromSession": {
        "id": "session_456",
        "name": "WhatsApp Principal"
      },
      "contact": {
        "id": "contact_1",
        "name": "João Silva",
        "phone": "+5511777777777"
      },
      "template": {
        "id": "template_2",
        "content": "Oi {nome}! Como você está? 😊"
      },
      "messageContent": "Oi João Silva! Como você está? 😊",
      "responseTime": 915,
      "error": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 125,
    "totalPages": 13
  },
  "summary": {
    "totalInternal": 38,
    "totalExternal": 87,
    "internalSuccessRate": 100.0,
    "externalSuccessRate": 95.4
  }
}
```

---

## 🎛️ Controles da Campanha

### 17. Pausar Campanha

**Endpoint:** `POST /warmup/campaigns/{campaignId}/pause`

**Resposta de Sucesso (200):**
```json
{
  "message": "Campaign paused successfully",
  "isActive": false,
  "pausedAt": "2025-08-18T16:55:00Z"
}
```

### 18. Retomar Campanha

**Endpoint:** `POST /warmup/campaigns/{campaignId}/resume`

**Resposta de Sucesso (200):**
```json
{
  "message": "Campaign resumed successfully",
  "isActive": true,
  "resumedAt": "2025-08-18T17:00:00Z"
}
```

### 19. Forçar Execução

**Endpoint:** `POST /warmup/campaigns/{campaignId}/execute`

**Descrição:** Força uma execução imediata (ignora intervalos)

**Payload:**
```json
{
  "executionType": "external",       // "internal" ou "external"
  "fromSessionId": "session_456",    // Sessão remetente (obrigatório)
  "contactId": "contact_1",          // Para execução externa
  "toSessionId": "session_789",      // Para execução interna
  "templateId": "template_1"         // Opcional: template específico
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Execution scheduled successfully",
  "execution": {
    "id": "exec_forced_001",
    "executionType": "external",
    "fromSessionId": "session_456",
    "contactId": "contact_1",
    "scheduledAt": "2025-08-18T17:05:00Z",
    "status": "scheduled"
  }
}
```

---

## 🏥 Saúde das Campanhas

### 20. Relatório de Saúde

**Endpoint:** `GET /warmup/health-report`

**Descrição:** Relatório geral de saúde de todas as campanhas

**Query Parameters:**
```
organizationId?: string  # Filtrar por organização (admin only)
```

**Resposta de Sucesso (200):**
```json
{
  "summary": {
    "totalCampaigns": 5,
    "activeCampaigns": 3,
    "pausedCampaigns": 2,
    "averageHealthScore": 82.4,
    "campaignsWithIssues": 1,
    "totalSessions": 12,
    "internalConversationsEnabled": 3
  },
  "campaigns": [
    {
      "id": "campaign_123",
      "name": "Aquecimento Multi-Sessão",
      "averageHealthScore": 85.5,
      "isActive": true,
      "sessionCount": 3,
      "enableInternalConversations": true,
      "internalConversationRatio": 0.3,
      "issues": [],
      "recommendations": [
        "Consider increasing internal conversation ratio",
        "Add more diverse templates for internal conversations"
      ]
    },
    {
      "id": "campaign_456",
      "name": "Aquecimento Vendas",
      "averageHealthScore": 65.2,
      "isActive": true,
      "sessionCount": 1,
      "enableInternalConversations": false,
      "issues": [
        "High failure rate detected",
        "Low response rate",
        "Single session campaign - consider adding more sessions"
      ],
      "recommendations": [
        "Review contact list quality",
        "Enable internal conversations with multiple sessions",
        "Improve message templates",
        "Reduce daily goal temporarily"
      ]
    }
  ]
}
```

---

## 📈 Dashboard de Monitoramento

### 21. Dashboard Overview

**Endpoint:** `GET /warmup/dashboard`

**Resposta de Sucesso (200):**
```json
{
  "overview": {
    "totalCampaigns": 5,
    "activeCampaigns": 3,
    "totalSessions": 12,
    "activeSessions": 10,
    "totalMessagesSentToday": 145,
    "internalMessagesToday": 43,
    "externalMessagesToday": 102,
    "averageHealthScore": 82.4,
    "totalContacts": 1250,
    "activeTemplates": 25,
    "internalConversationsEnabled": 3
  },
  "recentActivity": [
    {
      "type": "internal_conversation",
      "campaignName": "Aquecimento Multi-Sessão",
      "fromSessionName": "WhatsApp Principal",
      "toSessionName": "WhatsApp Vendas",
      "messageContent": "Oi WhatsApp Vendas! Como estão as vendas?",
      "timestamp": "2025-08-18T16:58:00Z"
    },
    {
      "type": "external_message",
      "campaignName": "Aquecimento Principal",
      "sessionName": "WhatsApp Suporte",
      "contactName": "João Silva",
      "timestamp": "2025-08-18T16:55:00Z"
    },
    {
      "type": "campaign_paused",
      "campaignName": "Aquecimento Vendas",
      "reason": "Low health score",
      "timestamp": "2025-08-18T16:45:00Z"
    }
  ],
  "alerts": [
    {
      "type": "health_warning",
      "campaignId": "campaign_456",
      "message": "Health score below 70%",
      "severity": "warning"
    },
    {
      "type": "internal_conversations_disabled",
      "campaignId": "campaign_789",
      "message": "Campaign has multiple sessions but internal conversations are disabled",
      "severity": "info"
    }
  ]
}
```

---

## 🔧 Configurações Avançadas

### 22. Configurações Globais

**Endpoint:** `GET /warmup/settings`

**Resposta de Sucesso (200):**
```json
{
  "defaultSettings": {
    "dailyMessageGoal": 30,
    "minIntervalMinutes": 15,
    "maxIntervalMinutes": 45,
    "useWorkingHours": true,
    "workingHourStart": 8,
    "workingHourEnd": 18,
    "allowWeekends": false,
    "randomizeInterval": true,
    "enableInternalConversations": false,
    "internalConversationRatio": 0.2,
    "healthThresholds": {
      "excellent": 90,
      "good": 75,
      "warning": 60,
      "danger": 40
    }
  },
  "limits": {
    "maxCampaignsPerOrganization": 10,
    "maxSessionsPerCampaign": 20,
    "maxTemplatesPerCampaign": 50,
    "maxContactsPerCampaign": 5000,
    "maxDailyMessageGoal": 100,
    "maxInternalConversationRatio": 0.8,
    "maxFileSize": 10485760
  },
  "internalConversations": {
    "enabled": true,
    "minSessionsRequired": 2,
    "recommendedRatios": {
      "newNumbers": 0.6,
      "warming": 0.4,
      "established": 0.2
    }
  }
}
```

---

## ❌ Códigos de Erro Comuns

| Código | Descrição | Situação |
|--------|-----------|----------|
| 400 | Bad Request | Dados inválidos no payload |
| 401 | Unauthorized | Token JWT inválido ou expirado |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: sessão já tem campanha ativa) |
| 413 | Payload Too Large | Arquivo muito grande |
| 422 | Unprocessable Entity | Dados válidos mas com regras de negócio violadas |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 📋 Modelos de Dados

### Campaign (Campanha)
```typescript
interface Campaign {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  dailyMessageGoal: number;
  enableInternalConversations: boolean;
  internalConversationRatio: number;
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  useWorkingHours: boolean;
  workingHourStart: number;
  workingHourEnd: number;
  allowWeekends: boolean;
  randomizeInterval: boolean;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CampaignSession (Sessão da Campanha)
```typescript
interface CampaignSession {
  id: string;
  campaignId: string;
  sessionId: string;
  healthScore: number;
  dailyMessagesSent: number;
  totalMessagesSent: number;
  lastMessageAt?: Date;
  lastResetDate: Date;
  isActive: boolean;
  createdAt: Date;
}
```

### Template (Modelo de Mensagem)
```typescript
interface Template {
  id: string;
  name: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  weight: number;
  isActive: boolean;
  campaignId: string;
  usageCount: number;
  createdAt: Date;
}
```

### Execution (Execução)
```typescript
interface Execution {
  id: string;
  campaignId: string;
  fromSessionId: string;
  toSessionId?: string;        // Para conversas internas
  contactId?: string;          // Para conversas externas
  templateId: string;
  messageContent: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  executionType: 'internal' | 'external';
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  createdAt: Date;
}
```

### HealthMetric (Métrica de Saúde)
```typescript
interface HealthMetric {
  id: string;
  campaignSessionId: string;
  date: Date;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  responsesReceived: number;
  averageMessagesPerHour: number;
  createdAt: Date;
}
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Criando uma Campanha Multi-Sessão

```bash
# 1. Criar campanha com conversas internas
curl -X POST "http://localhost:4000/warmup/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aquecimento Completo - 3 Sessões",
    "description": "Campanha avançada com múltiplas sessões conversando entre si",
    "dailyMessageGoal": 40,
    "enableInternalConversations": true,
    "internalConversationRatio": 0.4,
    "minIntervalMinutes": 20,
    "maxIntervalMinutes": 60,
    "useWorkingHours": true,
    "workingHourStart": 8,
    "workingHourEnd": 18,
    "allowWeekends": false,
    "sessionIds": ["session_1", "session_2", "session_3"],
    "contactIds": ["contact_1", "contact_2", "contact_3", "contact_4"]
  }'

# 2. Adicionar templates variados
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Saudação Amigável",
    "content": "Oi {nome}! {saudacao}, como você está?",
    "messageType": "text",
    "weight": 3
  }'

# 3. Monitorar conversas internas
curl -X GET "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/internal-conversations" \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 2: Forçando uma Conversa Interna

```bash
# Forçar conversa entre duas sessões específicas
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/internal-conversations/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromSessionId": "session_1",
    "toSessionId": "session_2",
    "templateId": "template_casual"
  }'
```

### Exemplo 3: Monitoramento Avançado

```bash
# Estatísticas detalhadas com breakdown interno/externo
curl -X GET "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/statistics?period=week" \
  -H "Authorization: Bearer $TOKEN"

# Histórico filtrado por tipo de execução
curl -X GET "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/executions?executionType=internal&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Exemplo 4: Configuração Recomendada por Fase

#### Fase 1: Aquecimento Inicial (Números Novos)
```json
{
  "enableInternalConversations": true,
  "internalConversationRatio": 0.6,
  "dailyMessageGoal": 15,
  "minIntervalMinutes": 30,
  "maxIntervalMinutes": 90
}
```

#### Fase 2: Aquecimento Moderado
```json
{
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "dailyMessageGoal": 30,
  "minIntervalMinutes": 20,
  "maxIntervalMinutes": 60
}
```

#### Fase 3: Aquecimento Avançado
```json
{
  "enableInternalConversations": true,
  "internalConversationRatio": 0.2,
  "dailyMessageGoal": 50,
  "minIntervalMinutes": 15,
  "maxIntervalMinutes": 45
}
```

---

## 🔔 Notificações WebSocket

### Conexão
```javascript
const socket = io('http://localhost:4000/notifications', {
  auth: { token: 'your_jwt_token' }
});
```

### Eventos de Conversas Internas

#### Execução de Conversa Interna
```javascript
socket.on('warmup_execution', (data) => {
  if (data.executionType === 'internal') {
    console.log(`${data.fromSessionName} → ${data.toSessionName}: ${data.messageContent}`);
  }
});
```

#### Progresso da Campanha
```javascript
socket.on('warmup_progress', (data) => {
  console.log(`Progresso: ${data.progress.dailyMessagesSent}/${data.progress.dailyGoal}`);
  console.log(`Saúde: ${data.progress.healthScore}%`);
});
```

#### Alerta de Saúde
```javascript
socket.on('warmup_health_update', (data) => {
  console.log(`Saúde ${data.sessionName}: ${data.currentHealth}% (${data.healthChange > 0 ? '+' : ''}${data.healthChange})`);
});
```

---

*Documentação atualizada em 18 de agosto de 2025 - Versão 2.0 com suporte a múltiplas sessões e conversas internas*

**✅ Status de Implementação:**
- ✅ Sistema de campanhas totalmente funcional
- ✅ Múltiplas sessões com conversas internas implementadas
- ✅ API completamente testada e operacional
- ✅ Dashboard de monitoramento implementado
- ✅ Todas as funcionalidades de aquecimento ativas
