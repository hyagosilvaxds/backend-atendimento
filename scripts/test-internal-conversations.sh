#!/bin/bash

# Script de teste para conversas internas do sistema de aquecimento
# Execute este script para testar a funcionalidade completa

BASE_URL="http://localhost:3000"
AUTH_TOKEN="your_jwt_token_here"

echo "=== Teste do Sistema de Conversas Internas ==="
echo

# 1. Criar uma campanha com conversas internas habilitadas
echo "1. Criando campanha com conversas internas..."
CAMPAIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/warmup/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "Teste Conversas Internas",
    "description": "Campanha de teste para validar conversas entre sessões",
    "dailyMessageGoal": 20,
    "enableInternalConversations": true,
    "internalConversationRatio": 0.5,
    "minIntervalMinutes": 5,
    "maxIntervalMinutes": 15,
    "randomizeInterval": true,
    "useWorkingHours": false,
    "allowWeekends": true,
    "sessionIds": ["session1", "session2", "session3"],
    "contactIds": ["contact1", "contact2"]
  }')

CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | jq -r '.id')
echo "✅ Campanha criada: $CAMPAIGN_ID"
echo

# 2. Adicionar templates de mensagem
echo "2. Adicionando templates de mensagem..."

# Template casual para conversas internas
curl -s -X POST "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "Conversa Casual",
    "content": "Oi {nome}, {saudacao}! Como estão as coisas por aí?",
    "messageType": "text",
    "weight": 3,
    "isActive": true
  }' > /dev/null

# Template de pergunta
curl -s -X POST "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "Pergunta Amigável",
    "content": "E aí {nome}, tudo certo? Estava lembrando de nossa conversa outro dia!",
    "messageType": "text", 
    "weight": 2,
    "isActive": true
  }' > /dev/null

# Template profissional
curl -s -X POST "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "name": "Contato Profissional",
    "content": "{saudacao} {nome}, espero que esteja bem. Podemos conversar quando tiver um tempo?",
    "messageType": "text",
    "weight": 1,
    "isActive": true
  }' > /dev/null

echo "✅ Templates adicionados"
echo

# 3. Verificar configuração da campanha
echo "3. Verificando configuração da campanha..."
CAMPAIGN_DETAILS=$(curl -s -X GET "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "📊 Configuração:"
echo $CAMPAIGN_DETAILS | jq '{
  name: .name,
  enableInternalConversations: .enableInternalConversations,
  internalConversationRatio: .internalConversationRatio,
  sessionsCount: (.campaignSessions | length),
  contactsCount: (.campaignContacts | length),
  templatesCount: (.messageTemplates | length)
}'
echo

# 4. Ativar campanha
echo "4. Ativando campanha..."
curl -s -X PATCH "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "isActive": true
  }' > /dev/null

echo "✅ Campanha ativada"
echo

# 5. Simular processamento (normalmente feito pelo cron job)
echo "5. Aguardando processamento automático..."
echo "   (O sistema processará automaticamente a cada 5 minutos)"
echo "   Para forçar processamento, reinicie o serviço ou aguarde o próximo ciclo"
echo

# 6. Verificar execuções após alguns minutos
echo "6. Para verificar execuções depois:"
echo "   GET $BASE_URL/warmup/campaigns/$CAMPAIGN_ID/stats"
echo

# 7. Exemplo de resposta esperada
echo "7. Exemplo de execuções esperadas:"
echo '{
  "stats": {
    "totalExecutions": 10,
    "internalExecutions": 5,
    "externalExecutions": 5,
    "successRate": 100
  },
  "recentExecutions": [
    {
      "executionType": "internal",
      "fromSession": "WhatsApp Principal",
      "toSession": "WhatsApp Secundário", 
      "messageContent": "Oi WhatsApp Secundário, Bom dia! Como estão as coisas por aí?",
      "status": "scheduled"
    },
    {
      "executionType": "external",
      "fromSession": "WhatsApp Principal",
      "contact": "João Silva",
      "messageContent": "Oi João Silva, Bom dia! Como estão as coisas por aí?",
      "status": "scheduled"
    }
  ]
}'
echo

echo "=== Teste configurado com sucesso! ==="
echo "A campanha está ativa e processará automaticamente."
echo "Monitore as notificações WebSocket para ver as execuções em tempo real."
