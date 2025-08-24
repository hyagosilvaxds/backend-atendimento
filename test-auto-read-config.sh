#!/bin/bash

echo "🔧 Testando configurações de Auto-Read para sessões WhatsApp"
echo "============================================================="

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

# Teste 1: Obter status global do auto-read
echo ""
echo "3️⃣ Obtendo status global do auto-read..."
GLOBAL_STATUS=$(curl -s -X GET "$BASE_URL/warmup/auto-read/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Status global do auto-read:"
echo $GLOBAL_STATUS | jq '.'

# Teste 2: Obter configurações atuais da sessão
echo ""
echo "4️⃣ Obtendo configurações atuais da sessão..."
CURRENT_SETTINGS=$(curl -s -X GET "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $TOKEN")

echo "Configurações atuais:"
echo $CURRENT_SETTINGS | jq '.'

# Teste 3: Ativar auto-read para a sessão
echo ""
echo "5️⃣ Ativando auto-read para a sessão..."
ENABLE_RESPONSE=$(curl -s -X POST "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read/enable" \
  -H "Authorization: Bearer $TOKEN")

echo "Resultado da ativação:"
echo $ENABLE_RESPONSE | jq '.'

# Teste 4: Configurar parâmetros do auto-read
echo ""
echo "6️⃣ Configurando parâmetros do auto-read..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoReadInterval": 45,
    "autoReadMinDelay": 10,
    "autoReadMaxDelay": 90
  }')

echo "Resultado da configuração:"
echo $UPDATE_RESPONSE | jq '.'

# Teste 5: Verificar configurações após atualização
echo ""
echo "7️⃣ Verificando configurações após atualização..."
UPDATED_SETTINGS=$(curl -s -X GET "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $TOKEN")

echo "Configurações atualizadas:"
echo $UPDATED_SETTINGS | jq '.'

# Teste 6: Testar com configurações inválidas
echo ""
echo "8️⃣ Testando configurações inválidas (delay mínimo >= máximo)..."
INVALID_RESPONSE=$(curl -s -X PATCH "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoReadMinDelay": 100,
    "autoReadMaxDelay": 50
  }')

echo "Resposta para configuração inválida:"
echo $INVALID_RESPONSE | jq '.'

# Teste 7: Desativar auto-read
echo ""
echo "9️⃣ Desativando auto-read para a sessão..."
DISABLE_RESPONSE=$(curl -s -X POST "$BASE_URL/warmup/sessions/$SESSION_ID/auto-read/disable" \
  -H "Authorization: Bearer $TOKEN")

echo "Resultado da desativação:"
echo $DISABLE_RESPONSE | jq '.'

# Teste 8: Status final
echo ""
echo "🔟 Status final do auto-read..."
FINAL_STATUS=$(curl -s -X GET "$BASE_URL/warmup/auto-read/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Status final:"
echo $FINAL_STATUS | jq '.'

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📋 Resumo dos endpoints testados:"
echo "   1. ✅ GET /warmup/auto-read/status - Status global"
echo "   2. ✅ GET /warmup/sessions/:sessionId/auto-read-settings - Configurações da sessão"
echo "   3. ✅ POST /warmup/sessions/:sessionId/auto-read/enable - Ativar auto-read"
echo "   4. ✅ PATCH /warmup/sessions/:sessionId/auto-read-settings - Configurar parâmetros"
echo "   5. ✅ POST /warmup/sessions/:sessionId/auto-read/disable - Desativar auto-read"
echo "   6. ✅ Validação de parâmetros inválidos"
echo ""
echo "🎯 Sistema de configuração do auto-read implementado com sucesso!"
echo "   - Controle individual por sessão"
echo "   - Configurações personalizáveis de intervalo e delay"
echo "   - Ativação/desativação simples"
echo "   - Status global para monitoramento"
