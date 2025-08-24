#!/bin/bash

# Script para testar o sistema de validação de números WhatsApp
# Execute com: ./test-phone-validation.sh

echo "🔍 Testando Sistema de Validação de Números WhatsApp"
echo "=================================================="

# Configurações
BASE_URL="http://localhost:4000"
LOGIN_ENDPOINT="/auth/login"
VALIDATE_ENDPOINT="/contacts/validate-phone"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer login e obter token
get_auth_token() {
    echo -e "${YELLOW}🔐 Fazendo login...${NC}"
    
    LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}${LOGIN_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@teste.com",
            "password": "123456"
        }')
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro no login: $LOGIN_RESPONSE${NC}"
        return 1
    fi
}

# Função para testar validação de número
test_phone_validation() {
    local phone=$1
    local description=$2
    
    echo -e "\n${YELLOW}📞 Testando: $description${NC}"
    echo "Número: $phone"
    
    RESPONSE=$(curl -s -X POST "${BASE_URL}${VALIDATE_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"phone\": \"$phone\"}")
    
    echo "Resposta: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"isValid":true'; then
        echo -e "${GREEN}✅ Número VÁLIDO${NC}"
    elif echo "$RESPONSE" | grep -q '"isValid":false'; then
        echo -e "${RED}❌ Número INVÁLIDO${NC}"
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$ERROR" ]; then
            echo "Motivo: $ERROR"
        fi
    else
        echo -e "${RED}❌ Erro na requisição: $RESPONSE${NC}"
    fi
}

# Verificar se o servidor está rodando
echo "🌐 Verificando se o servidor está rodando..."
if ! curl -s "${BASE_URL}/auth/login" > /dev/null; then
    echo -e "${RED}❌ Servidor não está rodando! Inicie com: npm run start:dev${NC}"
    exit 1
fi

# Fazer login
if ! get_auth_token; then
    exit 1
fi

echo -e "\n🧪 Iniciando testes de validação..."

# Testes de formato brasileiro
test_phone_validation "5511999999999" "Número brasileiro válido (SP)"
test_phone_validation "5521987654321" "Número brasileiro válido (RJ)"
test_phone_validation "5585988776655" "Número brasileiro válido (CE)"

# Testes de formato inválido
test_phone_validation "11999999999" "Sem código do país (deve falhar)"
test_phone_validation "5511" "Muito curto (deve falhar)"
test_phone_validation "55119999999999" "Muito longo (deve falhar)"
test_phone_validation "1234567890" "Formato internacional inválido (deve falhar)"
test_phone_validation "5500123456789" "DDD inválido (00) (deve falhar)"
test_phone_validation "5599123456789" "DDD inválido (99) (deve falhar)"

# Testes com formatação
test_phone_validation "+55 11 99999-9999" "Com formatação (+55 11 99999-9999)"
test_phone_validation "(11) 99999-9999" "Formato local ((11) 99999-9999)"
test_phone_validation "55 11 9 9999-9999" "Com espaços"

echo -e "\n${GREEN}🎉 Testes concluídos!${NC}"
echo -e "\n${YELLOW}📋 Como usar o endpoint de validação:${NC}"
echo "POST /contacts/validate-phone"
echo "Headers: Authorization: Bearer <token>"
echo "Body: {\"phone\": \"5511999999999\"}"
echo ""
echo "Resposta de sucesso:"
echo "{"
echo "  \"isValid\": true,"
echo "  \"exists\": true,"
echo "  \"formattedNumber\": \"5511999999999\""
echo "}"
echo ""
echo "Resposta de erro:"
echo "{"
echo "  \"isValid\": false,"
echo "  \"error\": \"Descrição do erro\""
echo "}"
