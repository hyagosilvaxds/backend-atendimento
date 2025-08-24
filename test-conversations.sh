#!/bin/bash

# Script de Teste - Sistema de Conversação
# Execute este script para testar as funcionalidades principais

set -e

# Configurações
API_URL="http://localhost:3000"
TOKEN=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Sistema de Conversação - Teste Automático${NC}"
echo "================================================="

# Função para fazer login e obter token
login() {
    echo -e "${YELLOW}📋 Fazendo login...${NC}"
    
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@empresa.com",
            "password": "admin123"
        }')
    
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
    
    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Falha no login. Verifique se o servidor está rodando.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Login realizado com sucesso!${NC}"
    echo "Token: ${TOKEN:0:20}..."
}

# Função para testar criação de conversa
test_create_conversation() {
    echo -e "\n${YELLOW}💬 Testando criação de conversa...${NC}"
    
    # Primeiro, vamos buscar uma sessão WhatsApp
    SESSIONS_RESPONSE=$(curl -s -X GET "$API_URL/whatsapp/sessions" \
        -H "Authorization: Bearer $TOKEN")
    
    SESSION_ID=$(echo $SESSIONS_RESPONSE | jq -r '.data[0].id // empty')
    
    if [ -z "$SESSION_ID" ]; then
        echo -e "${RED}❌ Nenhuma sessão WhatsApp encontrada. Crie uma sessão primeiro.${NC}"
        return 1
    fi
    
    echo "Usando sessão: $SESSION_ID"
    
    CONVERSATION_RESPONSE=$(curl -s -X POST "$API_URL/conversations" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "type": "CONTACT",
            "chatId": "5511999999999@c.us",
            "name": "Teste Automático",
            "sessionId": "'$SESSION_ID'"
        }')
    
    CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.id // empty')
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${RED}❌ Falha ao criar conversa${NC}"
        echo $CONVERSATION_RESPONSE | jq '.'
        return 1
    fi
    
    echo -e "${GREEN}✅ Conversa criada com sucesso!${NC}"
    echo "ID: $CONVERSATION_ID"
    
    # Salvar para próximos testes
    echo $CONVERSATION_ID > /tmp/conversation_id
    echo $SESSION_ID > /tmp/session_id
}

# Função para testar listagem de conversas
test_list_conversations() {
    echo -e "\n${YELLOW}📋 Testando listagem de conversas...${NC}"
    
    CONVERSATIONS_RESPONSE=$(curl -s -X GET "$API_URL/conversations" \
        -H "Authorization: Bearer $TOKEN")
    
    CONVERSATIONS_COUNT=$(echo $CONVERSATIONS_RESPONSE | jq '.data | length')
    
    echo -e "${GREEN}✅ ${CONVERSATIONS_COUNT} conversas encontradas${NC}"
    echo $CONVERSATIONS_RESPONSE | jq '.data[0] // "Nenhuma conversa"'
}

# Função para testar envio de mensagem
test_send_message() {
    echo -e "\n${YELLOW}📨 Testando envio de mensagem...${NC}"
    
    if [ ! -f /tmp/session_id ]; then
        echo -e "${RED}❌ Session ID não encontrado. Execute o teste de criação de conversa primeiro.${NC}"
        return 1
    fi
    
    SESSION_ID=$(cat /tmp/session_id)
    
    MESSAGE_RESPONSE=$(curl -s -X POST "$API_URL/messages/send/$SESSION_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "chatId": "5511999999999@c.us",
            "type": "TEXT",
            "content": "Mensagem de teste automático - '$(date)'"
        }')
    
    MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.id // empty')
    
    if [ -z "$MESSAGE_ID" ]; then
        echo -e "${RED}❌ Falha ao enviar mensagem${NC}"
        echo $MESSAGE_RESPONSE | jq '.'
        return 1
    fi
    
    echo -e "${GREEN}✅ Mensagem enviada com sucesso!${NC}"
    echo "ID: $MESSAGE_ID"
}

# Função para testar listagem de mensagens
test_list_messages() {
    echo -e "\n${YELLOW}📜 Testando listagem de mensagens...${NC}"
    
    if [ ! -f /tmp/conversation_id ]; then
        echo -e "${RED}❌ Conversation ID não encontrado. Execute o teste de criação de conversa primeiro.${NC}"
        return 1
    fi
    
    CONVERSATION_ID=$(cat /tmp/conversation_id)
    
    MESSAGES_RESPONSE=$(curl -s -X GET "$API_URL/messages/conversation/$CONVERSATION_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    MESSAGES_COUNT=$(echo $MESSAGES_RESPONSE | jq '.data | length')
    
    echo -e "${GREEN}✅ ${MESSAGES_COUNT} mensagens encontradas${NC}"
    echo $MESSAGES_RESPONSE | jq '.data[0] // "Nenhuma mensagem"'
}

# Função para testar estatísticas
test_stats() {
    echo -e "\n${YELLOW}📊 Testando estatísticas...${NC}"
    
    STATS_RESPONSE=$(curl -s -X GET "$API_URL/conversations/stats" \
        -H "Authorization: Bearer $TOKEN")
    
    echo -e "${GREEN}✅ Estatísticas obtidas:${NC}"
    echo $STATS_RESPONSE | jq '.'
}

# Função para testar atualização de conversa
test_update_conversation() {
    echo -e "\n${YELLOW}✏️ Testando atualização de conversa...${NC}"
    
    if [ ! -f /tmp/conversation_id ]; then
        echo -e "${RED}❌ Conversation ID não encontrado. Execute o teste de criação de conversa primeiro.${NC}"
        return 1
    fi
    
    CONVERSATION_ID=$(cat /tmp/conversation_id)
    
    UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/conversations/$CONVERSATION_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Teste Automático (Atualizado)",
            "isPinned": true
        }')
    
    if [ "$(echo $UPDATE_RESPONSE | jq -r '.name')" = "Teste Automático (Atualizado)" ]; then
        echo -e "${GREEN}✅ Conversa atualizada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Falha ao atualizar conversa${NC}"
        echo $UPDATE_RESPONSE | jq '.'
    fi
}

# Função para verificar permissões
test_permissions() {
    echo -e "\n${YELLOW}🔒 Testando permissões...${NC}"
    
    # Tentar acessar endpoint protegido
    PROTECTED_RESPONSE=$(curl -s -X GET "$API_URL/conversations" \
        -H "Authorization: Bearer invalid_token")
    
    if [ "$(echo $PROTECTED_RESPONSE | jq -r '.statusCode')" = "401" ]; then
        echo -e "${GREEN}✅ Proteção de endpoint funcionando!${NC}"
    else
        echo -e "${RED}❌ Falha na proteção de endpoint${NC}"
    fi
}

# Função para limpeza
cleanup() {
    echo -e "\n${YELLOW}🧹 Limpando arquivos temporários...${NC}"
    rm -f /tmp/conversation_id /tmp/session_id
}

# Função principal
main() {
    echo "Iniciando testes..."
    
    # Verificar se jq está instalado
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq não está instalado. Instale com: brew install jq (macOS) ou apt-get install jq (Ubuntu)${NC}"
        exit 1
    fi
    
    # Verificar se o servidor está rodando
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Servidor não está rodando em $API_URL${NC}"
        echo "Inicie o servidor com: npm run start:dev"
        exit 1
    fi
    
    # Executar testes
    login
    test_permissions
    test_create_conversation
    test_list_conversations
    test_send_message
    test_list_messages
    test_update_conversation
    test_stats
    
    echo -e "\n${GREEN}🎉 Todos os testes concluídos!${NC}"
    echo "================================================="
    echo -e "${BLUE}Para testes interativos, acesse:${NC}"
    echo "http://localhost:3000/conversations-test-client.html"
    
    cleanup
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  --help, -h     Mostrar esta ajuda"
    echo "  --url URL      URL do servidor (padrão: http://localhost:3000)"
    echo ""
    echo "Exemplo:"
    echo "  $0 --url http://production.server.com"
    exit 0
fi

if [ "$1" = "--url" ]; then
    API_URL="$2"
    echo "Usando URL personalizada: $API_URL"
fi

# Executar testes
main
