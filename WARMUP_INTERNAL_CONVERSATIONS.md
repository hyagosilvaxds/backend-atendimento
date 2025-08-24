# Sistema de Conversas Internas - Aquecimento de WhatsApp

## Visão Geral

O sistema de aquecimento foi aprimorado para suportar **conversas internas** entre diferentes sessões do WhatsApp dentro da mesma campanha. Esta funcionalidade permite que as sessões conversem entre si, simulando interações naturais entre números reais para melhorar o aquecimento dos chips.

## Como Funciona

### Configuração da Campanha

Ao criar uma campanha de aquecimento, você pode configurar:

```json
{
  "name": "Campanha Multi-Sessão",
  "enableInternalConversations": true,
  "internalConversationRatio": 0.3,
  "sessionIds": ["session1", "session2", "session3"]
}
```

**Parâmetros:**
- `enableInternalConversations`: Habilita conversas entre sessões
- `internalConversationRatio`: Porcentagem de mensagens que serão conversas internas (0.0 a 1.0)
  - `0.3` = 30% das mensagens serão entre sessões, 70% para contatos externos

### Funcionamento Automático

O sistema decide automaticamente quando enviar mensagens internas:

1. **Verificação de Elegibilidade**: 
   - Campanha deve ter `enableInternalConversations: true`
   - Deve ter pelo menos 2 sessões ativas
   - Probabilidade baseada em `internalConversationRatio`

2. **Seleção de Sessões**:
   - Sessão origem: A sessão atual no processamento
   - Sessão destino: Escolhida aleatoriamente entre as outras sessões ativas

3. **Personalização**:
   - As mensagens são personalizadas com dados da sessão de destino
   - Variáveis como `{nome}` são substituídas pelo nome da sessão

## Estrutura de Dados

### WarmupExecution Aprimorada

```typescript
{
  id: string;
  campaignId: string;
  fromSessionId: string;        // Sessão que envia
  toSessionId?: string;         // Sessão que recebe (conversas internas)
  contactId?: string;           // Contato externo (conversas externas)
  templateId: string;
  messageContent: string;
  messageType: 'text' | 'image' | 'document';
  executionType: 'internal' | 'external';  // Novo campo
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt: Date;
  sentAt?: Date;
  createdAt: Date;
}
```

### Campos da Campanha

```typescript
{
  enableInternalConversations: boolean;     // Padrão: false
  internalConversationRatio: number;        // Padrão: 0.2 (20%)
}
```

## API Endpoints

### Criar Campanha com Conversas Internas

```http
POST /warmup/campaigns
Content-Type: application/json

{
  "name": "Campanha Avançada",
  "dailyMessageGoal": 50,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "minIntervalMinutes": 15,
  "maxIntervalMinutes": 45,
  "sessionIds": ["session1", "session2", "session3"],
  "contactIds": ["contact1", "contact2"]
}
```

### Resposta

```json
{
  "id": "campaign_123",
  "name": "Campanha Avançada",
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "campaignSessions": [
    {
      "sessionId": "session1",
      "session": {
        "name": "WhatsApp Principal",
        "phone": "+5511999999999"
      }
    },
    {
      "sessionId": "session2", 
      "session": {
        "name": "WhatsApp Secundário",
        "phone": "+5511888888888"
      }
    }
  ]
}
```

## Notificações WebSocket

### Execução de Conversa Interna

```json
{
  "type": "warmup_execution",
  "data": {
    "campaignId": "campaign_123",
    "campaignName": "Campanha Avançada",
    "sessionId": "session1",
    "sessionName": "WhatsApp Principal",
    "contactId": "session2",
    "contactName": "WhatsApp Secundário",
    "contactPhone": "+5511888888888",
    "messageContent": "Oi WhatsApp Secundário, como vai?",
    "messageType": "text",
    "status": "scheduled",
    "scheduledAt": "2024-01-15T10:30:00Z"
  }
}
```

## Templates de Mensagem

Os templates funcionam normalmente, mas para conversas internas, as variáveis são preenchidas com dados da sessão de destino:

### Template
```
Oi {nome}, tudo bem? Estava pensando em você hoje {saudacao}!
```

### Resultado para Conversa Interna
```
Oi WhatsApp Secundário, tudo bem? Estava pensando em você hoje Bom dia!
```

### Variáveis Disponíveis
- `{nome}`: Nome da sessão de destino
- `{telefone}`: Telefone da sessão de destino  
- `{saudacao}`: Saudação baseada no horário (Bom dia/Boa tarde/Boa noite)

## Métricas e Relatórios

### Estatísticas de Campanha

```json
{
  "stats": {
    "totalExecutions": 150,
    "internalExecutions": 45,    // Novo campo
    "externalExecutions": 105,   // Novo campo
    "successRate": 95.2,
    "averageHealthScore": 87.5
  },
  "executionBreakdown": {
    "internal": {
      "scheduled": 5,
      "sent": 35,
      "delivered": 33,
      "read": 28
    },
    "external": {
      "scheduled": 8,
      "sent": 89,
      "delivered": 85,
      "read": 72
    }
  }
}
```

## Benefícios

### 1. Aquecimento Mais Natural
- Simula conversas reais entre números conhecidos
- Melhora a reputação dos números no WhatsApp
- Reduz o risco de bloqueios e limitações

### 2. Flexibilidade
- Controle preciso da proporção de conversas internas
- Mantém conversas externas para contatos reais
- Configuração por campanha

### 3. Escalabilidade
- Funciona com qualquer número de sessões
- Distribui conversas automaticamente
- Respeita limites e intervalos configurados

## Boas Práticas

### 1. Proporção Recomendada
- Início: 20-30% de conversas internas
- Aquecimento avançado: 40-50%
- Nunca 100% interno (mantém naturalidade)

### 2. Templates Variados
- Use templates diferentes para conversas internas
- Mantenha tom casual e natural
- Evite repetições óbvias

### 3. Monitoramento
- Acompanhe métricas de saúde
- Ajuste proporções baseado nos resultados
- Monitore taxas de entrega e leitura

## Limitações

1. **Mínimo de Sessões**: Precisa de pelo menos 2 sessões ativas
2. **Templates Compartilhados**: Usa os mesmos templates da campanha
3. **Contadores**: Conversas internas contam para limite diário da sessão origem

## Configuração Recomendada

```json
{
  "enableInternalConversations": true,
  "internalConversationRatio": 0.3,
  "minIntervalMinutes": 20,
  "maxIntervalMinutes": 60,
  "dailyMessageGoal": 40,
  "randomizeInterval": true,
  "useWorkingHours": true,
  "workingHourStart": 8,
  "workingHourEnd": 22
}
```

Esta configuração proporciona um aquecimento equilibrado com 30% de conversas internas e 70% externas, com intervalos naturais e horário comercial respeitado.
