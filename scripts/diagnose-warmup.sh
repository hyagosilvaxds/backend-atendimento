#!/bin/bash

# Script para diagnosticar problemas com aquecimento de campanhas
# Autor: Sistema de Aquecimento WhatsApp
# Data: 19 de agosto de 2025

set -e

# Configurações
BASE_URL="http://localhost:4000"
JWT_TOKEN="${JWT_TOKEN:-}"
CAMPAIGN_ID="${CAMPAIGN_ID:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Verificações iniciais
if [ -z "$JWT_TOKEN" ]; then
    error "JWT_TOKEN não está definido. Use: export JWT_TOKEN=seu_token_aqui"
    exit 1
fi

if [ -z "$CAMPAIGN_ID" ]; then
    error "CAMPAIGN_ID não está definido. Use: export CAMPAIGN_ID=sua_campanha_aqui"
    exit 1
fi

log "🚀 Iniciando diagnóstico de campanha de aquecimento"
log "Base URL: $BASE_URL"
log "Campaign ID: $CAMPAIGN_ID"
echo ""

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

# 1. Verificar se a campanha existe
check "Verificando dados da campanha..."
campaign_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID")

if echo "$campaign_response" | grep -q '"id"'; then
    campaign_name=$(echo "$campaign_response" | jq -r '.name // "Nome não disponível"')
    is_active=$(echo "$campaign_response" | jq -r '.isActive // false')
    daily_goal=$(echo "$campaign_response" | jq -r '.dailyMessageGoal // 0')
    min_interval=$(echo "$campaign_response" | jq -r '.minIntervalMinutes // 0')
    max_interval=$(echo "$campaign_response" | jq -r '.maxIntervalMinutes // 0')
    internal_enabled=$(echo "$campaign_response" | jq -r '.enableInternalConversations // false')
    internal_ratio=$(echo "$campaign_response" | jq -r '.internalConversationRatio // 0')
    
    success "Campanha encontrada: $campaign_name"
    info "Status ativo: $is_active"
    info "Meta diária: $daily_goal mensagens"
    info "Intervalo: $min_interval - $max_interval minutos"
    info "Conversas internas: $internal_enabled (proporção: $internal_ratio)"
else
    error "Campanha não encontrada ou erro de autenticação"
    echo "$campaign_response" | jq '.'
    exit 1
fi

echo ""

# 2. Verificar sessões da campanha
check "Verificando sessões da campanha..."
sessions_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/sessions")

if echo "$sessions_response" | grep -q '"data"'; then
    sessions_count=$(echo "$sessions_response" | jq -r '.summary.totalSessions // 0')
    active_sessions=$(echo "$sessions_response" | jq -r '.summary.activeSessions // 0')
    
    if [ "$sessions_count" -gt 0 ]; then
        success "Sessões encontradas: $sessions_count (ativas: $active_sessions)"
        
        # Listar sessões
        echo "$sessions_response" | jq -r '.data[] | "  📱 \(.session.name // "Sem nome") (\(.session.phone // "Sem telefone")) - Status: \(.session.status // "unknown") - Ativa: \(.isActive)"'
        
        # Verificar saúde das sessões
        avg_health=$(echo "$sessions_response" | jq -r '.summary.averageHealthScore // 0')
        info "Health Score médio: $avg_health%"
        
        if (( $(echo "$avg_health < 70" | bc -l) )); then
            warning "Health Score baixo pode afetar o envio de mensagens"
        fi
    else
        error "Nenhuma sessão encontrada na campanha"
        echo "➡️  Adicione sessões com: POST /warmup/campaigns/$CAMPAIGN_ID/sessions"
    fi
else
    error "Erro ao obter sessões da campanha"
    echo "$sessions_response" | jq '.'
fi

echo ""

# 3. Verificar contatos da campanha
check "Verificando contatos da campanha..."
contacts_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/contacts")

if echo "$contacts_response" | grep -q '"data"'; then
    contacts_count=$(echo "$contacts_response" | jq -r '.data | length')
    
    if [ "$contacts_count" -gt 0 ]; then
        success "Contatos encontrados: $contacts_count"
        
        # Mostrar alguns contatos
        echo "$contacts_response" | jq -r '.data[0:3][] | "  👤 \(.name // "Sem nome") (\(.phone // "Sem telefone")) - Interações: \(.interactionCount // 0)"'
        
        if [ "$contacts_count" -gt 3 ]; then
            info "... e mais $(($contacts_count - 3)) contatos"
        fi
    else
        error "Nenhum contato encontrado na campanha"
        echo "➡️  Adicione contatos com: POST /warmup/campaigns/$CAMPAIGN_ID/contacts"
    fi
else
    error "Erro ao obter contatos da campanha"
    echo "$contacts_response" | jq '.'
fi

echo ""

# 4. Verificar templates da campanha
check "Verificando templates da campanha..."
templates_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/templates")

if echo "$templates_response" | grep -q '"data"'; then
    templates_count=$(echo "$templates_response" | jq -r '.summary.totalTemplates // 0')
    active_templates=$(echo "$templates_response" | jq -r '.summary.activeTemplates // 0')
    
    if [ "$active_templates" -gt 0 ]; then
        success "Templates encontrados: $templates_count (ativos: $active_templates)"
        
        # Mostrar alguns templates
        echo "$templates_response" | jq -r '.data[0:2][] | "  📝 \(.name // "Sem nome") (peso: \(.weight // 1)) - Ativo: \(.isActive)"'
        
        if [ "$templates_count" -gt 2 ]; then
            info "... e mais $(($templates_count - 2)) templates"
        fi
    else
        error "Nenhum template ativo encontrado na campanha"
        echo "➡️  Adicione templates com: POST /warmup/campaigns/$CAMPAIGN_ID/templates/import"
    fi
else
    error "Erro ao obter templates da campanha"
    echo "$templates_response" | jq '.'
fi

echo ""

# 5. Verificar execuções recentes
check "Verificando execuções recentes..."
executions_response=$(make_request "GET" "/warmup/campaigns/$CAMPAIGN_ID/executions?limit=5")

if echo "$executions_response" | grep -q '"data"'; then
    executions_count=$(echo "$executions_response" | jq -r '.pagination.total // 0')
    
    if [ "$executions_count" -gt 0 ]; then
        success "Execuções encontradas: $executions_count"
        
        # Mostrar execuções recentes
        echo "$executions_response" | jq -r '.data[] | "  🚀 \(.executionType // "unknown") - \(.status // "unknown") - \(.scheduledAt // "sem data")"'
        
        # Estatísticas
        internal_rate=$(echo "$executions_response" | jq -r '.summary.internalSuccessRate // 0')
        external_rate=$(echo "$executions_response" | jq -r '.summary.externalSuccessRate // 0')
        info "Taxa de sucesso interna: $internal_rate%"
        info "Taxa de sucesso externa: $external_rate%"
    else
        warning "Nenhuma execução encontrada ainda"
        info "Isso pode ser normal se a campanha foi criada recentemente"
    fi
else
    error "Erro ao obter execuções da campanha"
    echo "$executions_response" | jq '.'
fi

echo ""

# 6. Verificar horário atual vs horário permitido
check "Verificando configurações de horário..."
current_hour=$(date +%H)
current_day=$(date +%u)  # 1=Monday, 7=Sunday

use_working_hours=$(echo "$campaign_response" | jq -r '.useWorkingHours // false')
working_start=$(echo "$campaign_response" | jq -r '.workingHourStart // 8')
working_end=$(echo "$campaign_response" | jq -r '.workingHourEnd // 18')
allow_weekends=$(echo "$campaign_response" | jq -r '.allowWeekends // false')

info "Horário atual: ${current_hour}h (dia da semana: $current_day)"
info "Usa horário comercial: $use_working_hours ($working_start h - $working_end h)"
info "Permite fins de semana: $allow_weekends"

# Verificar se está no horário permitido
in_allowed_time=true

if [ "$use_working_hours" = "true" ]; then
    if [ "$current_hour" -lt "$working_start" ] || [ "$current_hour" -ge "$working_end" ]; then
        in_allowed_time=false
        warning "Fora do horário comercial permitido"
    fi
fi

if [ "$allow_weekends" = "false" ] && ([ "$current_day" -eq 6 ] || [ "$current_day" -eq 7 ]); then
    in_allowed_time=false
    warning "Fins de semana não são permitidos"
fi

if [ "$in_allowed_time" = "true" ]; then
    success "Horário atual está dentro do permitido"
else
    warning "Horário atual NÃO está dentro do permitido - campanhas não executarão"
fi

echo ""

# 7. Diagnóstico geral
check "Diagnóstico geral da campanha..."

issues=0
recommendations=()

# Verificar requisitos básicos
if [ "$is_active" != "true" ]; then
    error "❌ Campanha está pausada"
    recommendations+=("Ative a campanha: POST /warmup/campaigns/$CAMPAIGN_ID/resume")
    ((issues++))
fi

if [ "$active_sessions" -lt 1 ]; then
    error "❌ Nenhuma sessão ativa"
    recommendations+=("Adicione pelo menos uma sessão ativa")
    ((issues++))
fi

if [ "$contacts_count" -lt 1 ]; then
    error "❌ Nenhum contato na campanha"
    recommendations+=("Adicione contatos à campanha")
    ((issues++))
fi

if [ "$active_templates" -lt 3 ]; then
    error "❌ Poucos templates ativos (mínimo recomendado: 3)"
    recommendations+=("Adicione mais templates para variedade")
    ((issues++))
fi

# Verificações adicionais
if [ "$sessions_count" -gt 1 ] && [ "$internal_enabled" != "true" ]; then
    warning "⚠️  Múltiplas sessões mas conversas internas desabilitadas"
    recommendations+=("Considere habilitar conversas internas para melhor aquecimento")
fi

if [ "$daily_goal" -gt 50 ]; then
    warning "⚠️  Meta diária muito alta para números novos"
    recommendations+=("Considere reduzir a meta diária para números em aquecimento")
fi

if [ "$min_interval" -lt 15 ]; then
    warning "⚠️  Intervalo mínimo muito baixo"
    recommendations+=("Considere aumentar o intervalo mínimo para 15+ minutos")
fi

echo ""
echo "=================================="
echo "         RESUMO DO DIAGNÓSTICO"
echo "=================================="

if [ "$issues" -eq 0 ]; then
    success "🎉 Campanha parece estar configurada corretamente!"
    
    if [ "$in_allowed_time" = "true" ]; then
        success "✨ Campanha deve começar a executar em breve (próximos 5 minutos)"
    else
        info "⏰ Campanha executará quando estiver no horário permitido"
    fi
else
    error "❌ Encontrados $issues problemas que impedem a execução"
fi

echo ""
if [ ${#recommendations[@]} -gt 0 ]; then
    echo "💡 RECOMENDAÇÕES:"
    for rec in "${recommendations[@]}"; do
        echo "   • $rec"
    done
fi

echo ""

# 8. Testar retomada da campanha se ela estiver pausada
if [ "$is_active" != "true" ]; then
    echo "🔧 TESTE: Tentando retomar a campanha..."
    
    resume_response=$(make_request "POST" "/warmup/campaigns/$CAMPAIGN_ID/resume")
    
    if echo "$resume_response" | grep -q '"message"'; then
        test_executions=$(echo "$resume_response" | jq -r '.testExecutions // 0')
        success "Campanha retomada com sucesso!"
        success "Mensagens de teste enviadas: $test_executions"
        
        if [ "$test_executions" -gt 0 ]; then
            echo "$resume_response" | jq -r '.testMessages[]? | "  🧪 Teste \(.type): \(.fromSession // "N/A") → \(.toSession // .toContact // "N/A")"'
        fi
    else
        error "Erro ao retomar campanha"
        echo "$resume_response" | jq '.'
    fi
fi

echo ""
echo "=================================="
success "🏁 Diagnóstico concluído!"
info "Para monitorar execuções em tempo real:"
echo "   curl -H \"Authorization: Bearer \$JWT_TOKEN\" \"$BASE_URL/warmup/campaigns/$CAMPAIGN_ID/executions?limit=10\""
echo ""

exit 0
