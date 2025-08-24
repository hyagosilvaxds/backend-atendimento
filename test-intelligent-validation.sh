#!/bin/bash

# Script para testar a nova validação inteligente de números WhatsApp
# Este script testa números com 8 e 9 dígitos para verificar qual formato realmente existe

echo "🧪 Testando Validação Inteligente de Números WhatsApp"
echo "================================================="

API_BASE="http://localhost:4000"

# Função para testar um número
test_phone() {
    local phone="$1"
    local description="$2"
    
    echo ""
    echo "📱 Testando: $phone ($description)"
    echo "----------------------------------------"
    
    response=$(curl -s -X POST \
        "$API_BASE/test/validate-phone" \
        -H "Content-Type: application/json" \
        -d "{\"phone\": \"$phone\"}")
    
    echo "Resposta:"
    echo "$response" | jq '.'
}

# Aguardar servidor estar disponível
echo "⏳ Aguardando servidor estar disponível..."
until curl -s "$API_BASE" > /dev/null; do
    sleep 1
done
echo "✅ Servidor disponível!"

# Casos de teste com números problemáticos
echo ""
echo "🔍 Testando casos problemáticos (8 vs 9 dígitos):"

# Número do exemplo mencionado
test_phone "+55 38 99155-3294" "Número com 9 no início (pode estar incorreto)"
test_phone "+55 38 9155-3294" "Número sem 9 no início (pode ser o correto)"

# Outros casos típicos
test_phone "+55 11 99999-8888" "SP - com 9 no início"
test_phone "+55 11 9999-8888" "SP - sem 9 no início"

test_phone "+55 21 98765-4321" "RJ - com 9 no início"
test_phone "+55 21 8765-4321" "RJ - sem 9 no início"

test_phone "+55 31 97777-1234" "BH - com 9 no início"
test_phone "+55 31 7777-1234" "BH - sem 9 no início"

# Números claramente inválidos para verificar se são rejeitados
echo ""
echo "🚫 Testando números inválidos:"
test_phone "+55 00 1234-5678" "DDD inválido (00)"
test_phone "+55 11 1111-1111" "Todos dígitos iguais"
test_phone "+55 11 123" "Muito curto"

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📋 Resumo:"
echo "- A nova validação testa automaticamente variações com 8 e 9 dígitos"
echo "- Retorna qual formato realmente existe no WhatsApp"
echo "- Mostra todos os números testados para transparência"
echo "- Resolve o problema de números que passam na validação mas não existem"
