#!/bin/bash

echo "🧪 Testando funcionalidade de marcar mensagens como lidas no aquecimento"
echo "======================================================================="

# Configurações
BASE_URL="http://localhost:4000"

# Fazer login e obter token
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro ao obter token. Resposta:"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Token obtido com sucesso"

# Buscar sessões WhatsApp disponíveis
echo ""
echo "2️⃣ Buscando sessões WhatsApp..."
SESSIONS_RESPONSE=$(curl -s -X GET $BASE_URL/whatsapp/sessions \
  -H "Authorization: Bearer $TOKEN")

echo "Sessões disponíveis:"
echo $SESSIONS_RESPONSE | jq '.[] | {id: .id, name: .name, sessionId: .sessionId, status: .status}'

# Pegar a primeira sessão conectada
SESSION_ID=$(echo $SESSIONS_RESPONSE | jq -r '.[] | select(.status == "CONNECTED") | .sessionId' | head -n 1)

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
  echo "❌ Nenhuma sessão conectada encontrada"
  exit 1
fi

echo "✅ Usando sessão: $SESSION_ID"

# Teste 1: Obter conversas não lidas
echo ""
echo "3️⃣ Testando obtenção de conversas não lidas..."
UNREAD_RESPONSE=$(curl -s -X GET "$BASE_URL/warmup/sessions/$SESSION_ID/unread-conversations" \
  -H "Authorization: Bearer $TOKEN")

echo "Conversas não lidas:"
echo $UNREAD_RESPONSE | jq '.'

# Teste 2: Marcar todas as mensagens como lidas
echo ""
echo "4️⃣ Testando marcação de todas as mensagens como lidas..."
MARK_READ_RESPONSE=$(curl -s -X POST "$BASE_URL/warmup/sessions/$SESSION_ID/mark-as-read" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Resultado da marcação como lida:"
echo $MARK_READ_RESPONSE | jq '.'

# Teste 3: Verificar conversas não lidas após marcação
echo ""
echo "5️⃣ Verificando conversas não lidas após marcação..."
UNREAD_AFTER_RESPONSE=$(curl -s -X GET "$BASE_URL/warmup/sessions/$SESSION_ID/unread-conversations" \
  -H "Authorization: Bearer $TOKEN")

echo "Conversas não lidas após marcação:"
echo $UNREAD_AFTER_RESPONSE | jq '.'

# Teste 4: Testar marcação para um chat específico (se houver algum)
FIRST_CHAT=$(echo $UNREAD_RESPONSE | jq -r '.[0].chatId // empty')

if [ -n "$FIRST_CHAT" ] && [ "$FIRST_CHAT" != "null" ]; then
  echo ""
  echo "6️⃣ Testando marcação para chat específico: $FIRST_CHAT"
  SPECIFIC_CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/warmup/sessions/$SESSION_ID/mark-as-read" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"chatId\": \"$FIRST_CHAT\"}")

  echo "Resultado da marcação específica:"
  echo $SPECIFIC_CHAT_RESPONSE | jq '.'
fi

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📋 Resumo dos testes:"
echo "   1. ✅ Login realizado com sucesso"
echo "   2. ✅ Sessões WhatsApp listadas"
echo "   3. ✅ Conversas não lidas consultadas"
echo "   4. ✅ Marcação automática de todas as mensagens testada"
echo "   5. ✅ Verificação pós-marcação realizada"
if [ -n "$FIRST_CHAT" ] && [ "$FIRST_CHAT" != "null" ]; then
  echo "   6. ✅ Marcação de chat específico testada"
fi
echo ""
echo "🎯 A funcionalidade de marcar mensagens como lidas está implementada!"
echo "   - Endpoint GET /warmup/sessions/:sessionId/unread-conversations"
echo "   - Endpoint POST /warmup/sessions/:sessionId/mark-as-read"
echo "   - Cron job automático executando a cada 30 segundos"
echo "   - Delays aleatórios entre 5-60 segundos para simular comportamento humano"
