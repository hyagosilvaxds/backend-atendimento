# 📁 Exemplos de Templates para Warmup

Esta pasta contém exemplos práticos de templates de mensagens para campanhas de aquecimento WhatsApp.

## 📋 Arquivos Disponíveis

### 1. `templates-warmup-casual.json`
**Propósito:** Conversas casuais e amigáveis  
**Quantidade:** 20 templates  
**Uso recomendado:** Conversas externas com contatos

**Características:**
- Saudações naturais
- Perguntas sobre dia a dia
- Mensagens de apoio e motivação
- Conversas sobre família, trabalho, hobbies

### 2. `templates-warmup-internal.json`
**Propósito:** Conversas entre sessões da mesma empresa  
**Quantidade:** 15 templates  
**Uso recomendado:** Conversas internas entre departamentos

**Características:**
- Coordenação de projetos
- Alinhamento entre equipes
- Discussões técnicas
- Colaboração interdepartamental

### 3. `templates-warmup-business.json`
**Propósito:** Conversas comerciais sutis  
**Quantidade:** 15 templates  
**Uso recomendado:** Networking profissional

**Características:**
- Perguntas sobre negócios
- Networking casual
- Apoio profissional
- Discussões de mercado

## 🚀 Como Usar

### Método 1: Importação via API

```bash
# Definir variáveis
export JWT_TOKEN="seu_token_jwt_aqui"
export CAMPAIGN_ID="sua_campanha_aqui"

# Importar templates casuais
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/templates-warmup-casual.json

# Importar templates internos
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/templates-warmup-internal.json

# Importar templates comerciais
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/templates-warmup-business.json
```

### Método 2: Script Automatizado

```bash
# Usar o script de teste (inclui todos os templates)
export JWT_TOKEN="seu_token_jwt_aqui"
export CAMPAIGN_ID="sua_campanha_aqui"

./scripts/test-template-import.sh
```

## 🎯 Recomendações de Uso

### Para Números Novos (Aquecimento Inicial)
```bash
# Use apenas templates casuais
curl -d @examples/templates-warmup-casual.json \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import
```

### Para Campanhas Multi-Sessão
```bash
# Use templates casuais + internos
curl -d @examples/templates-warmup-casual.json [...]
curl -d @examples/templates-warmup-internal.json [...]
```

### Para Relacionamento Comercial
```bash
# Use todos os tipos
curl -d @examples/templates-warmup-casual.json [...]
curl -d @examples/templates-warmup-internal.json [...]
curl -d @examples/templates-warmup-business.json [...]
```

## ⚙️ Personalização

### Modificando Templates

Você pode editar os arquivos JSON para personalizar:

1. **Conteúdo das mensagens**
2. **Pesos de seleção** (1-10)
3. **Status ativo/inativo**
4. **Adicionar novos templates**

### Exemplo de Customização

```json
{
  "name": "Minha Saudação Personalizada",
  "content": "Oi {nome}! Como está seu dia na [MINHA CIDADE]?",
  "messageType": "text", 
  "weight": 5,
  "isActive": true
}
```

### Variáveis Disponíveis

- `{nome}`: Nome do contato ou sessão
- `{telefone}`: Telefone do contato
- `{saudacao}`: Saudação automática baseada no horário
  - Manhã: "Bom dia"
  - Tarde: "Boa tarde"  
  - Noite: "Boa noite"

## 📊 Distribuição de Pesos

Os pesos controlam a frequência de uso:

| Peso | Frequência | Uso Recomendado |
|------|------------|-----------------|
| 1-2  | Baixa      | Mensagens especiais |
| 3-4  | Moderada   | Variações temáticas |
| 5    | Alta       | Mensagens principais |

## 🔄 Modo de Substituição

### Adição (padrão: `"replaceExisting": false`)
- Adiciona novos templates aos existentes
- Mantém templates anteriores ativos

### Substituição (`"replaceExisting": true`)
- Desativa templates existentes
- Ativa apenas os novos importados

## ⚠️ Importante

1. **Backup:** Sempre faça backup dos templates existentes antes de usar `"replaceExisting": true`

2. **Teste:** Teste os templates em campanha de desenvolvimento primeiro

3. **Monitoramento:** Acompanhe as métricas após importar novos templates

4. **Qualidade:** Templates ruins podem prejudicar o health score

## 📈 Próximos Passos

Após importar os templates:

1. **Verificar importação:**
   ```bash
   GET /warmup/campaigns/{campaignId}/templates
   ```

2. **Monitorar uso:**
   ```bash
   GET /warmup/campaigns/{campaignId}/statistics
   ```

3. **Acompanhar execuções:**
   ```bash
   GET /warmup/campaigns/{campaignId}/executions
   ```

## 🆘 Suporte

- **Documentação completa:** `WARMUP_IMPORT_DOCUMENTATION.md`
- **Requisitos de warmup:** `WARMUP_REQUIREMENTS_DOCUMENTATION.md`
- **API completa:** `WARMUP_API_COMPLETE_DOCS.md`

---

**Última atualização:** 19 de agosto de 2025  
**Compatível com:** Sistema Warmup v2.0+
