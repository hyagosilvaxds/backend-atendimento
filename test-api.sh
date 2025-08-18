#!/bin/bash

# Script de teste da API de Autenticação
# Execute: chmod +x test-api.sh && ./test-api.sh

BASE_URL="http://localhost:4000"

echo "🚀 Testando API de Autenticação"
echo "================================="

# 1. Login como Super Admin
echo "1️⃣  Fazendo login como Super Admin..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }')

echo "Response: $LOGIN_RESPONSE"
echo ""

# Extrair token (usando jq se disponível)
if command -v jq &> /dev/null; then
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
  echo "Token extraído: $TOKEN"
else
  echo "⚠️  jq não encontrado. Copie o token manualmente do response acima."
  echo "Para instalar jq: brew install jq"
  read -p "Cole o token aqui: " TOKEN
fi
echo ""

# 2. Obter perfil
echo "2️⃣  Obtendo perfil do usuário..."
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 3. Listar usuários
echo "3️⃣  Listando usuários..."
curl -s -X GET $BASE_URL/auth/users \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 4. Criar novo usuário
echo "4️⃣  Criando novo usuário..."
NEW_USER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "teste@empresa.com",
    "password": "senha123",
    "name": "Usuário de Teste",
    "organizationId": "cmeh3r34c0001vb6ogij4uflp",
    "role": "ORG_USER"
  }')

echo "Response: $NEW_USER_RESPONSE"
echo ""

# 5. Login com novo usuário
echo "5️⃣  Fazendo login com novo usuário..."
USER_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@empresa.com",
    "password": "senha123"
  }')

echo "Response: $USER_LOGIN_RESPONSE"
echo ""

# 6. Teste de forgot password
echo "6️⃣  Testando forgot password..."
curl -s -X POST $BASE_URL/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@empresa.com"
  }' | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

# 7. Logout
echo "7️⃣  Fazendo logout..."
curl -s -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "Response recebido"
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "📝 Para ver logs do servidor, verifique o terminal onde o NestJS está rodando."
echo "🌐 Acesse Prisma Studio em: http://localhost:5555"
