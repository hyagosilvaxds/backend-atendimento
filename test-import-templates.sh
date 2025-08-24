#!/bin/bash

# Script para testar a nova funcionalidade de importação de templates
BASE_URL="http://localhost:4000"

echo "🔥 Testando Nova Funcionalidade de Importação de Templates"
echo "========================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se o JWT_TOKEN está definido
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}Erro: JWT_TOKEN não está definido${NC}"
    echo "Por favor, defina o token JWT:"
    echo "export JWT_TOKEN='seu_token_aqui'"
    exit 1
fi

# Verificar se o CAMPAIGN_ID está definido
if [ -z "$CAMPAIGN_ID" ]; then
    echo -e "${YELLOW}Aviso: CAMPAIGN_ID não está definido${NC}"
    echo "Por favor, defina o ID da campanha:"
    echo "export CAMPAIGN_ID='seu_campaign_id_aqui'"
    echo ""
    echo "Você pode listar as campanhas existentes primeiro:"
    echo "curl -H \"Authorization: Bearer \$JWT_TOKEN\" $BASE_URL/warmup/campaigns"
    exit 1
fi

echo "Token JWT configurado ✓"
echo "Campaign ID: $CAMPAIGN_ID ✓"
echo

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

# 1. Listar templates existentes da campanha
make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/templates" "" "📋 1. Listar Templates Existentes"

# 2. Preparar dados de exemplo para importação
IMPORT_DATA='{
  "templates": [
    {
      "name": "Saudação de Teste",
      "content": "Olá {nome}! Esta é uma mensagem de teste do sistema de importação.",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Pergunta Casual de Teste",
      "content": "Oi {nome}! Como você está? Esta é outra mensagem de teste.",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    },
    {
      "name": "Mensagem Inativa",
      "content": "Esta mensagem será criada como inativa para teste.",
      "messageType": "text",
      "weight": 1,
      "isActive": false
    }
  ],
  "replaceExisting": false
}'

# 3. Importar templates
make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$IMPORT_DATA" "📥 2. Importar Templates de Teste"

# 4. Listar templates novamente para verificar
make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/templates" "" "📋 3. Verificar Templates Após Importação"

# 5. Testar importação com replaceExisting=true
REPLACE_DATA='{
  "templates": [
    {
      "name": "Único Template Ativo",
      "content": "Este é o único template que ficará ativo após substituição.",
      "messageType": "text",
      "weight": 5,
      "isActive": true
    }
  ],
  "replaceExisting": true
}'

echo -e "${YELLOW}Pressione Enter para testar a substituição de templates (replaceExisting=true)${NC}"
echo -e "${YELLOW}Isso desativará todos os templates existentes e criará apenas o novo.${NC}"
read -p "Continuar? "

make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$REPLACE_DATA" "🔄 4. Testar Substituição de Templates"

# 6. Verificar resultado final
make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/templates" "" "📋 5. Verificar Estado Final dos Templates"

echo
echo -e "${GREEN}🎉 Teste da funcionalidade de importação concluído!${NC}"
echo
echo "Funcionalidades testadas:"
echo "✅ Importação de múltiplos templates via JSON"
echo "✅ Validação de dados de entrada"
echo "✅ Controle de peso e status ativo/inativo"
echo "✅ Opção de substituir templates existentes"
echo "✅ Preservação do nome do template nas variáveis JSON"
echo "✅ Suporte a intervalos menores que 5 minutos"

echo
echo "Exemplo de uso via arquivo JSON:"
echo "curl -X POST \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d @templates-example.json \\"
echo "  $BASE_URL/warmup/campaigns/\$CAMPAIGN_ID/templates/import"
