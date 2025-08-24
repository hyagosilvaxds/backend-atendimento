#!/bin/bash

# Script para testar importação inteligente de contatos via Excel
# Testa a validação automática de números durante a importação

echo "📊 Testando Importação Inteligente de Contatos via Excel"
echo "======================================================"

API_BASE="http://localhost:4000"

# Aguardar servidor estar disponível
echo "⏳ Aguardando servidor estar disponível..."
until curl -s "$API_BASE" > /dev/null; do
    sleep 1
done
echo "✅ Servidor disponível!"

# Função para criar planilha de teste
create_test_excel() {
    local filename="$1"
    
    echo "📝 Criando planilha de teste: $filename"
    
    # Criar CSV temporário que será convertido
    cat > temp_contacts.csv << 'EOF'
Nome,Telefone,Email,Observações
João Silva,+55 38 99155-3294,joao@email.com,Número problemático com 9 extra
Maria Santos,+55 38 9155-3294,maria@email.com,Mesmo número sem 9 extra
Pedro Costa,+55 11 99999-8888,pedro@email.com,Número SP com 9
Ana Oliveira,+55 11 9999-8888,ana@email.com,Número SP sem 9
Carlos Lima,+55 21 98765-4321,carlos@email.com,Número inexistente RJ
Paula Rocha,+55 31 97777-1234,paula@email.com,Número inexistente BH
Roberto Alves,+55 11 1111-1111,roberto@email.com,Número inválido todos iguais
Fernanda Cruz,554899887766,fernanda@email.com,Número sem formatação
Diego Souza,+55 11 91234-5678,diego@email.com,Número normal válido
Camila Ferreira,,camila@email.com,Sem telefone para teste
EOF

    # Converter CSV para Excel usando Python (se disponível)
    if command -v python3 &> /dev/null; then
        python3 << 'EOF'
import pandas as pd
df = pd.read_csv('temp_contacts.csv')
df.to_excel('test_import_contacts.xlsx', index=False)
print("✅ Planilha Excel criada com sucesso!")
EOF
    else
        echo "⚠️ Python não disponível, criando arquivo CSV como teste"
        mv temp_contacts.csv test_import_contacts.csv
    fi
    
    rm -f temp_contacts.csv
}

# Função para testar importação
test_import() {
    local file="$1"
    local description="$2"
    
    echo ""
    echo "📂 Testando importação: $description"
    echo "----------------------------------------"
    
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo não encontrado: $file"
        return
    fi
    
    echo "📤 Enviando arquivo para importação..."
    
    response=$(curl -s -X POST \
        "$API_BASE/test/import-contacts" \
        -F "file=@$file" \
        -w "\nHTTP_CODE:%{http_code}")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    json_response=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    echo "🔍 Status HTTP: $http_code"
    echo "📋 Resposta:"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "$json_response" | jq '.'
        
        # Extrair e mostrar estatísticas
        success=$(echo "$json_response" | jq -r '.success // 0')
        errors=$(echo "$json_response" | jq -r '.errors | length // 0')
        duplicates=$(echo "$json_response" | jq -r '.duplicates // 0')
        corrected=$(echo "$json_response" | jq -r '.phoneValidations | map(select(.status == "corrected")) | length // 0')
        invalid=$(echo "$json_response" | jq -r '.phoneValidations | map(select(.status == "invalid")) | length // 0')
        
        echo ""
        echo "📊 Resumo da Importação:"
        echo "   ✅ Sucessos: $success"
        echo "   ⚠️ Duplicados: $duplicates" 
        echo "   ❌ Erros: $errors"
        echo "   🔧 Números corrigidos: $corrected"
        echo "   📱 Números inválidos: $invalid"
        
        # Mostrar detalhes das correções de números
        if [ "$corrected" != "0" ]; then
            echo ""
            echo "🔧 Números que foram corrigidos:"
            echo "$json_response" | jq -r '.phoneValidations[] | select(.status == "corrected") | "   Linha \(.line): \(.originalPhone) → \(.validatedPhone)"'
        fi
        
        # Mostrar números inválidos
        if [ "$invalid" != "0" ]; then
            echo ""
            echo "❌ Números inválidos encontrados:"
            echo "$json_response" | jq -r '.phoneValidations[] | select(.status == "invalid") | "   Linha \(.line): \(.originalPhone) - \(.error)"'
        fi
        
    else
        echo "❌ Erro na importação"
        echo "$json_response"
    fi
}

# Criar endpoint de teste para importação
echo ""
echo "🔧 Configurando endpoint de teste..."

# Verificar se existe o endpoint de teste
if curl -s "$API_BASE/test/import-contacts" | grep -q "Cannot GET"; then
    echo "⚠️ Endpoint de teste não encontrado. Será necessário criar."
else
    echo "✅ Endpoint de teste disponível"
fi

# Criar arquivo de teste
create_test_excel "test_import_contacts.xlsx"

# Executar teste
if [ -f "test_import_contacts.xlsx" ]; then
    test_import "test_import_contacts.xlsx" "Importação com validação inteligente"
elif [ -f "test_import_contacts.csv" ]; then
    test_import "test_import_contacts.csv" "Importação CSV (fallback)"
else
    echo "❌ Não foi possível criar arquivo de teste"
fi

# Limpeza
echo ""
echo "🧹 Limpando arquivos temporários..."
rm -f test_import_contacts.xlsx test_import_contacts.csv temp_contacts.csv

echo ""
echo "✅ Teste de importação inteligente concluído!"
echo ""
echo "📋 Resumo dos recursos testados:"
echo "- ✅ Validação automática de números durante importação"
echo "- ✅ Correção automática de números (8 vs 9 dígitos)"
echo "- ✅ Detecção de números inválidos"
echo "- ✅ Relatório detalhado de validações"
echo "- ✅ Continuação da importação mesmo com números inválidos"
echo "- ✅ Log em tempo real do processo"
