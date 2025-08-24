#!/bin/bash

# Script para testar importação de templates no sistema de warmup
# Autor: Sistema de Aquecimento WhatsApp
# Data: 19 de agosto de 2025

set -e  # Parar em caso de erro

# Configurações
BASE_URL="http://localhost:4000"
JWT_TOKEN="${JWT_TOKEN:-}"
CAMPAIGN_ID="${CAMPAIGN_ID:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se o JWT_TOKEN está definido
if [ -z "$JWT_TOKEN" ]; then
    error "JWT_TOKEN não está definido. Use: export JWT_TOKEN=seu_token_aqui"
fi

# Verificar se o CAMPAIGN_ID está definido
if [ -z "$CAMPAIGN_ID" ]; then
    error "CAMPAIGN_ID não está definido. Use: export CAMPAIGN_ID=sua_campanha_aqui"
fi

log "🚀 Iniciando teste de importação de templates"
log "Base URL: $BASE_URL"
log "Campaign ID: $CAMPAIGN_ID"

# Função para fazer requisições
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            "$BASE_URL$endpoint"
    fi
}

# Verificar se a campanha existe
log "📋 Verificando se a campanha existe..."
campaign_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID")

if echo "$campaign_response" | grep -q '"id"'; then
    campaign_name=$(echo "$campaign_response" | jq -r '.name // "Campanha Sem Nome"')
    success "Campanha encontrada: $campaign_name"
else
    error "Campanha não encontrada ou erro de autenticação"
fi

# Testar importação de templates casuais
log "📥 Importando templates casuais..."
if [ -f "examples/templates-warmup-casual.json" ]; then
    casual_data=$(cat examples/templates-warmup-casual.json)
    casual_response=$(make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$casual_data")
    
    if echo "$casual_response" | grep -q '"message"'; then
        success_count=$(echo "$casual_response" | jq -r '.summary.successfulImports // 0')
        failed_count=$(echo "$casual_response" | jq -r '.summary.failedImports // 0')
        success "Templates casuais: $success_count importados, $failed_count falharam"
    else
        warning "Erro ao importar templates casuais"
        echo "$casual_response" | jq '.'
    fi
else
    warning "Arquivo examples/templates-warmup-casual.json não encontrado"
fi

# Testar importação de templates para conversas internas
log "💬 Importando templates para conversas internas..."
if [ -f "examples/templates-warmup-internal.json" ]; then
    internal_data=$(cat examples/templates-warmup-internal.json)
    internal_response=$(make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$internal_data")
    
    if echo "$internal_response" | grep -q '"message"'; then
        success_count=$(echo "$internal_response" | jq -r '.summary.successfulImports // 0')
        failed_count=$(echo "$internal_response" | jq -r '.summary.failedImports // 0')
        success "Templates internos: $success_count importados, $failed_count falharam"
    else
        warning "Erro ao importar templates internos"
        echo "$internal_response" | jq '.'
    fi
else
    warning "Arquivo examples/templates-warmup-internal.json não encontrado"
fi

# Testar importação de templates comerciais
log "💼 Importando templates comerciais..."
if [ -f "examples/templates-warmup-business.json" ]; then
    business_data=$(cat examples/templates-warmup-business.json)
    business_response=$(make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$business_data")
    
    if echo "$business_response" | grep -q '"message"'; then
        success_count=$(echo "$business_response" | jq -r '.summary.successfulImports // 0')
        failed_count=$(echo "$business_response" | jq -r '.summary.failedImports // 0')
        success "Templates comerciais: $success_count importados, $failed_count falharam"
    else
        warning "Erro ao importar templates comerciais"
        echo "$business_response" | jq '.'
    fi
else
    warning "Arquivo examples/templates-warmup-business.json não encontrado"
fi

# Verificar total de templates após importação
log "📊 Verificando total de templates..."
templates_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/templates")

if echo "$templates_response" | grep -q '"data"'; then
    total_templates=$(echo "$templates_response" | jq -r '.summary.totalTemplates // 0')
    active_templates=$(echo "$templates_response" | jq -r '.summary.activeTemplates // 0')
    success "Total de templates: $total_templates (ativos: $active_templates)"
else
    warning "Erro ao obter lista de templates"
fi

# Testar importação com erro (JSON inválido)
log "🧪 Testando importação com dados inválidos..."
invalid_data='{"templates": [{"name": "", "content": ""}], "replaceExisting": false}'
invalid_response=$(make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/templates/import" "$invalid_data")

if echo "$invalid_response" | grep -q '"error"'; then
    success "Validação funcionando: erro detectado corretamente"
else
    warning "Sistema deveria ter rejeitado dados inválidos"
fi

# Verificar se a campanha está pronta para executar
log "🎯 Verificando se a campanha está pronta..."
campaign_updated=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID")

sessions_count=$(echo "$campaign_updated" | jq -r '.campaignSessions | length // 0')
contacts_count=$(echo "$campaign_updated" | jq -r '.campaignContacts | length // 0')
templates_count=$(echo "$campaign_updated" | jq -r '.messageTemplates | length // 0')

echo ""
log "📈 Resumo da Campanha:"
echo "  • Sessões: $sessions_count"
echo "  • Contatos: $contacts_count" 
echo "  • Templates: $templates_count"

# Verificar requisitos mínimos
if [ "$sessions_count" -ge 1 ] && [ "$contacts_count" -ge 1 ] && [ "$templates_count" -ge 3 ]; then
    success "✨ Campanha pronta para iniciar o aquecimento!"
    
    is_active=$(echo "$campaign_updated" | jq -r '.isActive // false')
    if [ "$is_active" = "true" ]; then
        success "🚀 Campanha está ativa e funcionando"
    else
        warning "⏸️  Campanha está pausada - ative para começar"
    fi
else
    warning "⚠️  Campanha ainda não tem todos os requisitos:"
    [ "$sessions_count" -lt 1 ] && echo "    - Precisa de pelo menos 1 sessão"
    [ "$contacts_count" -lt 1 ] && echo "    - Precisa de pelo menos 1 contato"
    [ "$templates_count" -lt 3 ] && echo "    - Precisa de pelo menos 3 templates"
fi

echo ""
success "🎉 Teste de importação concluído!"

# Exibir próximos passos
echo ""
log "🔮 Próximos passos recomendados:"
echo "  1. Monitorar execuções: GET /warmup/campaigns/$CAMPAIGN_ID/executions"
echo "  2. Verificar estatísticas: GET /warmup/campaigns/$CAMPAIGN_ID/statistics"
echo "  3. Acompanhar saúde: GET /warmup/dashboard"
echo ""

exit 0
