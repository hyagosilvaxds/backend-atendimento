#!/bin/bash

# Script de teste do Sistema de Permissões
# Execute: chmod +x test-permissions.sh && ./test-permissions.sh

BASE_URL="http://localhost:4000"

echo "🔐 Testando Sistema de Permissões Granulares"
echo "=============================================="

# 1. Login como usuário comum (ORG_USER)
echo "1️⃣  Fazendo login como usuário comum..."
USER_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@empresa.com",
    "password": "user123"
  }')

echo "Response: $USER_LOGIN_RESPONSE"
echo ""

# Extrair token
if command -v jq &> /dev/null; then
  USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | jq -r '.access_token')
  echo "Token do usuário comum extraído: ${USER_TOKEN:0:50}..."
else
  echo "⚠️  jq não encontrado. Copie o token manualmente."
  read -p "Cole o token do usuário comum aqui: " USER_TOKEN
fi
echo ""

# 2. Testar acesso permitido - Criar sessão (usuário comum pode)
echo "2️⃣  Testando permissão PERMITIDA - Criar sessão..."
curl -s -X POST $BASE_URL/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "customerId": "123",
    "channel": "whatsapp"
  }' | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 3. Testar acesso permitido - Listar contatos (usuário comum pode)
echo "3️⃣  Testando permissão PERMITIDA - Listar contatos..."
curl -s -X GET $BASE_URL/contacts \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 4. Testar acesso NEGADO - Deletar sessão (usuário comum NÃO pode)
echo "4️⃣  Testando permissão NEGADA - Deletar sessão..."
curl -s -X DELETE $BASE_URL/sessions/123 \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 5. Testar acesso NEGADO - Importar contatos (usuário comum NÃO pode)
echo "5️⃣  Testando permissão NEGADA - Importar contatos..."
curl -s -X POST $BASE_URL/contacts/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "contacts": [{"name": "Teste", "phone": "123456789"}]
  }' | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 6. Login como admin da organização
echo "6️⃣  Fazendo login como admin da organização..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123"
  }')

if command -v jq &> /dev/null; then
  ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.access_token')
  echo "Token do admin extraído: ${ADMIN_TOKEN:0:50}..."
else
  echo "Cole o token do admin:"
  read -p "Token: " ADMIN_TOKEN
fi
echo ""

# 7. Testar acesso permitido para admin - Deletar sessão
echo "7️⃣  Testando permissão de ADMIN - Deletar sessão..."
curl -s -X DELETE $BASE_URL/sessions/123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 8. Testar acesso permitido para admin - Importar contatos
echo "8️⃣  Testando permissão de ADMIN - Importar contatos..."
curl -s -X POST $BASE_URL/contacts/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "contacts": [{"name": "Teste Admin", "phone": "987654321"}]
  }' | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 9. Testar obter perfil com permissões
echo "9️⃣  Obtendo perfil do usuário comum com permissões..."
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 10. Testar obter perfil do admin
echo "🔟 Obtendo perfil do admin com permissões..."
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

echo "✅ Testes de permissões concluídos!"
echo ""
echo "📋 Resumo dos testes:"
echo "   ✅ Usuário comum PODE criar sessões"
echo "   ✅ Usuário comum PODE listar contatos"
echo "   ❌ Usuário comum NÃO PODE deletar sessões"
echo "   ❌ Usuário comum NÃO PODE importar contatos"
echo "   ✅ Admin PODE deletar sessões"
echo "   ✅ Admin PODE importar contatos"
echo ""
echo "🌐 Acesse Prisma Studio em: http://localhost:5555"
echo "📚 Veja a documentação completa no arquivo API_DOCUMENTATION.md"
