#!/bin/bash

# Script para testar a configuração de auto-read por sessão de aquecimento
# Uso: ./test-warmup-autoread.sh

BASE_URL="http://localhost:3000"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"

echo "🔧 Teste de Configuração de Auto-Read por Sessão de Aquecimento"
echo "============================================================="

# Defina os IDs de teste (você deve substituir por IDs reais)
CAMPAIGN_ID="cm4hwx4r80000g5qnlzvz6mxs"  # Substitua pelo ID de uma campanha real
SESSION_ID="cm4hwx4r80000g5qnlzvz6mxr"   # Substitua pelo ID de uma sessão real

echo ""
echo "📋 1. Obtendo configurações atuais da sessão de aquecimento..."
curl -X GET \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "⚙️ 2. Atualizando configurações de auto-read..."
curl -X PUT \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoReadEnabled": true,
    "autoReadInterval": 60,
    "autoReadMinDelay": 10,
    "autoReadMaxDelay": 30
  }' | jq '.'

echo ""
echo ""
echo "🔄 3. Ativando auto-read para a sessão de aquecimento..."
curl -X POST \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/sessions/$SESSION_ID/auto-read-toggle" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }' | jq '.'

echo ""
echo ""
echo "📊 4. Verificando status geral da campanha..."
curl -X GET \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/auto-read-status" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "📋 5. Verificando configurações após as alterações..."
curl -X GET \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/sessions/$SESSION_ID/auto-read-settings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "❌ 6. Desativando auto-read..."
curl -X POST \
  "$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/sessions/$SESSION_ID/auto-read-toggle" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }' | jq '.'

echo ""
echo ""
echo "✅ Teste concluído!"
echo ""
echo "Novos endpoints de auto-read por sessão de aquecimento:"
echo "  GET    /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-settings"
echo "  PUT    /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-settings"
echo "  POST   /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-toggle"
echo "  GET    /warmup/campaigns/:campaignId/auto-read-status"
echo ""
echo "Diferenças da implementação anterior:"
echo "  - Configuração agora é por sessão de aquecimento, não por sessão WhatsApp"
echo "  - Cada sessão pode ter configurações independentes dentro da mesma campanha"
echo "  - Status da campanha mostra resumo de todas as sessões de aquecimento"
echo "  - Cron job processa apenas sessões de aquecimento ativas com auto-read habilitado"
