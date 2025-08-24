#!/bin/bash

# Script para testar a funcionalidade de auto-read corrigida
# Uso: ./test-autoread-fix.sh

BASE_URL="http://localhost:4000"

echo "🔧 Teste da Correção de Auto-Read"
echo "=================================="

# IDs de teste - substituir por valores reais
SESSION_ID="session_cmeh3r34c0001vb6ogij4uflp_1755551497408"  # Da logs: session que está processando
CHAT_ID="120363162650227859@newsletter"  # Da logs: chat que estava sendo processado

echo ""
echo "📋 Testando marcação manual de mensagens como lidas..."
echo "Sessão: $SESSION_ID"
echo "Chat: $CHAT_ID"

# Simular requisição sem autenticação para ver se endpoint existe
echo ""
echo "🔍 1. Verificando se endpoint existe..."
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/warmup/sessions/$SESSION_ID/mark-as-read" \
  -H "Content-Type: application/json" \
  -d "{\"chatId\": \"$CHAT_ID\"}"

echo ""
echo ""
echo "📊 2. Verificando conversas não lidas..."
curl -s -o /dev/null -w "%{http_code}" -X GET \
  "$BASE_URL/warmup/sessions/$SESSION_ID/unread-conversations"

echo ""
echo ""
echo "✅ Se os códigos acima forem 401 (Unauthorized), os endpoints existem"
echo "❌ Se forem 404 (Not Found), há problema na rota"
echo ""
echo "🔧 Principais correções implementadas:"
echo "  1. chatModify() para marcar chat inteiro como lido"
echo "  2. sendPresenceUpdate() como fallback para simular leitura"
echo "  3. readMessages() com ID dummy como último recurso"
echo ""
echo "📝 Para testar completamente:"
echo "  1. Use um token de autenticação válido"
echo "  2. Substitua SESSION_ID e CHAT_ID por valores reais"
echo "  3. Monitore os logs do servidor para ver qual método está sendo usado"
echo ""
echo "📊 Logs importantes para monitorar:"
echo "  - 'Chat marcado como lido usando chatModify'"
echo "  - 'Presença de leitura simulada no chat'"
echo "  - 'readMessages executado no chat'"
echo "  - Qualquer erro de 'Todos os métodos falharam'"
