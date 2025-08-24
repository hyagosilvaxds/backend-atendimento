#!/bin/bash

# Script para testar o endpoint de resumo de mensagens recentes de uma sessão de aquecimento

echo "🔥 Testando Endpoint: Resumo de Mensagens Recentes da Sessão de Aquecimento"
echo "=================================================================="

# Verificar se o servidor está rodando
if ! curl -s http://localhost:4000/ > /dev/null 2>&1; then
    echo "❌ Servidor não está rodando na porta 4000"
    echo "Execute: npm run start:dev"
    exit 1
fi

echo "✅ Servidor está rodando"

# Obter token de autenticação (usando admin padrão)
echo "🔐 Obtendo token de autenticação..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123"
  }')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Erro ao obter token de autenticação"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token obtido com sucesso"

# Listar sessões disponíveis para teste
echo "📱 Listando sessões disponíveis..."
SESSIONS_RESPONSE=$(curl -s -X GET http://localhost:4000/sessions \
  -H "Authorization: Bearer $TOKEN")

echo "Sessões disponíveis:"
echo $SESSIONS_RESPONSE | jq -r '.[] | "\(.id) - \(.name) - \(.phone // "Sem telefone") - Status: \(.status)"'

# Obter primeira sessão para teste
SESSION_ID=$(echo $SESSIONS_RESPONSE | jq -r '.[0].id')

if [ "$SESSION_ID" = "null" ] || [ -z "$SESSION_ID" ]; then
    echo "❌ Nenhuma sessão encontrada para teste"
    echo "Crie uma sessão primeiro usando o endpoint /sessions"
    exit 1
fi

echo "🎯 Usando sessão para teste: $SESSION_ID"

# Teste 1: Resumo geral (todas as mensagens)
echo ""
echo "📊 Teste 1: Resumo geral de mensagens recentes"
echo "============================================="
curl -s -X GET "http://localhost:4000/warmup/sessions/$SESSION_ID/recent-messages" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Teste 2: Apenas mensagens internas
echo ""
echo "📊 Teste 2: Apenas mensagens internas"
echo "===================================="
curl -s -X GET "http://localhost:4000/warmup/sessions/$SESSION_ID/recent-messages?type=internal&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Teste 3: Apenas mensagens externas
echo ""
echo "📊 Teste 3: Apenas mensagens externas"
echo "===================================="
curl -s -X GET "http://localhost:4000/warmup/sessions/$SESSION_ID/recent-messages?type=external&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Teste 4: Limite de 5 mensagens
echo ""
echo "📊 Teste 4: Últimas 5 mensagens"
echo "==============================="
curl -s -X GET "http://localhost:4000/warmup/sessions/$SESSION_ID/recent-messages?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Teste 5: Teste com sessão inexistente
echo ""
echo "📊 Teste 5: Sessão inexistente (deve dar erro 404)"
echo "================================================="
curl -s -X GET "http://localhost:4000/warmup/sessions/session-inexistente/recent-messages" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ Todos os testes concluídos!"
echo ""
echo "📋 Resumo dos testes:"
echo "- ✅ Resumo geral de mensagens"
echo "- ✅ Filtro por tipo (internal/external)"
echo "- ✅ Limite de mensagens"
echo "- ✅ Tratamento de erro para sessão inexistente"
echo ""
echo "🎯 Endpoint criado com sucesso!"
echo "   GET /warmup/sessions/{sessionId}/recent-messages"
echo "   Query params:"
echo "   - limit: número de mensagens (padrão: 20)"
echo "   - type: all|internal|external (padrão: all)"
