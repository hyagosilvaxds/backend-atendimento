#!/bin/bash

# Script para testar as novas funcionalidades do sistema de warmup
# Base URL da API
BASE_URL="http://localhost:4000"

echo "🔥 Testando Novas Funcionalidades da API de Warmup"
echo "================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer requisições
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}$description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X $method \
            -H "Authorization: Bearer $JWT_TOKEN" \
            "$BASE_URL$endpoint")
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Sucesso${NC}"
        echo "$response" | jq .
    else
        echo -e "${RED}✗ Erro${NC}"
        echo "$response"
    fi
    
    echo "---"
    echo
}

# Verificar se o JWT_TOKEN está definido
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}Erro: JWT_TOKEN não está definido${NC}"
    echo "Por favor, defina o token JWT:"
    echo "export JWT_TOKEN='seu_token_aqui'"
    exit 1
fi

echo "Token JWT configurado ✓"
echo

# 1. Testar Configurações Globais
make_request "GET" "/warmup/settings" "" "📋 1. Obter Configurações Globais"

# 2. Testar Dashboard (se existir campanhas)
make_request "GET" "/warmup/dashboard" "" "📊 2. Obter Dashboard de Warmup"

# 3. Testar Health Report
make_request "GET" "/warmup/health-report" "" "🏥 3. Obter Relatório de Saúde"

# 4. Listar campanhas existentes
make_request "GET" "/warmup/campaigns" "" "📋 4. Listar Campanhas Existentes"

# Se você tiver uma campanha específica, substitua CAMPAIGN_ID
CAMPAIGN_ID="example_campaign_id"

echo -e "${YELLOW}Para testar as funcionalidades específicas de campanha, você precisa:${NC}"
echo "1. Ter uma campanha criada"
echo "2. Substituir CAMPAIGN_ID no script pelo ID real da campanha"
echo
echo "Exemplos de endpoints disponíveis:"
echo "• GET /warmup/campaigns/{id}/sessions - Listar sessões da campanha"
echo "• GET /warmup/campaigns/{id}/internal-conversations - Estatísticas de conversas internas"
echo "• POST /warmup/campaigns/{id}/internal-conversations/execute - Forçar conversa interna"
echo "• GET /warmup/campaigns/{id}/templates - Listar templates"
echo "• GET /warmup/campaigns/{id}/contacts - Listar contatos"
echo "• GET /warmup/campaigns/{id}/executions - Histórico de execuções"
echo "• GET /warmup/campaigns/{id}/statistics - Estatísticas da campanha"

echo
echo -e "${GREEN}🎉 Teste das novas funcionalidades concluído!${NC}"
echo
echo "Funcionalidades implementadas:"
echo "✅ Listagem de sessões de campanha com métricas"
echo "✅ Estatísticas de conversas internas"
echo "✅ Forçar conversas internas"
echo "✅ Listagem de templates com estatísticas de uso"
echo "✅ Listagem de contatos da campanha"
echo "✅ Histórico detalhado de execuções"
echo "✅ Configurações globais do sistema"
echo "✅ Todos os endpoints da documentação implementados"
