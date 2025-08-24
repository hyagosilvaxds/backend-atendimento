# 🚀 Atualizações do Sistema de Warmup

## ✅ Mudanças Implementadas

### 1. **Configurações Individuais por Campanha**
- ❌ **Removido**: Endpoint de configurações globais (`GET /warmup/settings`)
- ✅ **Implementado**: Cada campanha agora tem suas próprias configurações
- ✅ **Intervalos Flexíveis**: Permite intervalos menores que 5 minutos entre mensagens
- ✅ **Configurações Específicas**: `minIntervalMinutes` pode ser de 1 a 1440 minutos

### 2. **Nova Funcionalidade: Importação de Templates via JSON**
- ✅ **Endpoint**: `POST /warmup/campaigns/{campaignId}/templates/import`
- ✅ **Formato JSON**: Suporte a importação em lote de mensagens
- ✅ **Validação Completa**: Validação de dados com DTOs do class-validator
- ✅ **Controle de Substituição**: Opção para substituir templates existentes

---

## 📋 Nova Funcionalidade: Importação de Templates

### **Endpoint**: `POST /warmup/campaigns/{campaignId}/templates/import`

**Descrição:** Importa múltiplos templates de mensagem via JSON

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Payload:**
```json
{
  "templates": [
    {
      "name": "Saudação Matinal",
      "content": "Bom dia, {nome}! Como você está hoje?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Pergunta Casual",
      "content": "Oi {nome}! Tudo bem por aí?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    }
  ],
  "replaceExisting": false
}
```

**Campos do Template:**
- `name`: Nome identificador do template (obrigatório)
- `content`: Conteúdo da mensagem com variáveis (obrigatório)
- `messageType`: Tipo de mensagem (padrão: "text")
- `weight`: Peso para seleção aleatória 1-10 (padrão: 1)
- `isActive`: Se o template está ativo (padrão: true)

**Campos da Requisição:**
- `templates`: Array de templates para importar (obrigatório)
- `replaceExisting`: Se deve desativar templates existentes (padrão: false)

**Resposta de Sucesso (200):**
```json
{
  "message": "Templates import completed",
  "summary": {
    "totalImported": 2,
    "successfulImports": 2,
    "failedImports": 0,
    "replaceExisting": false,
    "totalActiveTemplates": 5
  },
  "createdTemplates": [
    {
      "id": "template_new1",
      "name": "Saudação Matinal",
      "content": "Bom dia, {nome}! Como você está hoje?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "id": "template_new2",
      "name": "Pergunta Casual",
      "content": "Oi {nome}! Tudo bem por aí?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    }
  ],
  "errors": []
}
```

**Erros Possíveis:**
```json
// 400 - Bad Request
{
  "statusCode": 400,
  "message": [
    "Templates array is required and cannot be empty",
    "Template at index 0 must have name and content"
  ],
  "error": "Bad Request"
}

// 404 - Not Found
{
  "statusCode": 404,
  "message": "Campaign not found",
  "error": "Not Found"
}
```

---

## 🔧 Configurações Atualizadas

### **Intervalos Flexíveis**
Agora é possível configurar intervalos muito curtos entre mensagens:

```json
{
  "minIntervalMinutes": 1,     // Mínimo: 1 minuto
  "maxIntervalMinutes": 5,     // Máximo: pode ser até 1440 (24h)
  "dailyMessageGoal": 200      // Meta diária ajustável
}
```

### **Configurações por Campanha**
Cada campanha tem controle total sobre seus parâmetros:

```json
{
  "name": "Aquecimento Intensivo",
  "dailyMessageGoal": 300,
  "minIntervalMinutes": 2,
  "maxIntervalMinutes": 10,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.7,
  "useWorkingHours": false,
  "allowWeekends": true,
  "randomizeInterval": true
}
```

---

## 📁 Arquivos de Exemplo

### **templates-example.json**
```json
{
  "templates": [
    {
      "name": "Saudação Matinal",
      "content": "Bom dia, {nome}! Como você está hoje?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Pergunta Casual",
      "content": "Oi {nome}! Tudo bem por aí? Como foi o seu dia?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    },
    {
      "name": "Saudação Vespertina",
      "content": "{saudacao}, {nome}! Espero que esteja tendo um ótimo dia!",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Conversa Sobre Trabalho",
      "content": "E aí {nome}, como estão as coisas no trabalho? Tudo correndo bem?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    },
    {
      "name": "Mensagem de Apoio",
      "content": "Oi {nome}! Só passando aqui para desejar uma excelente semana para você! 😊",
      "messageType": "text",
      "weight": 1,
      "isActive": true
    }
  ],
  "replaceExisting": false
}
```

---

## 🧪 Como Testar

### **1. Via Script Automatizado:**
```bash
export JWT_TOKEN="seu_token_jwt"
export CAMPAIGN_ID="id_da_campanha"
./test-import-templates.sh
```

### **2. Via cURL com Arquivo:**
```bash
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @templates-example.json \
  http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import
```

### **3. Via cURL Direto:**
```bash
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "Teste",
        "content": "Oi {nome}! Como vai?",
        "messageType": "text",
        "weight": 2,
        "isActive": true
      }
    ],
    "replaceExisting": false
  }' \
  http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import
```

---

## 🔍 Validações Implementadas

### **DTOs com Class-Validator:**
- ✅ Validação de tipos de dados
- ✅ Validação de array mínimo (pelo menos 1 template)
- ✅ Validação de peso (1-10)
- ✅ Validação de campos obrigatórios
- ✅ Transformação automática de tipos

### **Regras de Negócio:**
- ✅ Nome e conteúdo obrigatórios
- ✅ Peso limitado entre 1 e 10
- ✅ Preservação do nome nas variáveis JSON
- ✅ Controle de templates ativos/inativos
- ✅ Opção de substituição em lote

---

## 💾 Estrutura de Dados

### **Como os Templates são Salvos:**
```json
{
  "id": "template_123",
  "content": "[Nome do Template] Conteúdo da mensagem...",
  "messageType": "text",
  "weight": 3,
  "isActive": true,
  "variables": {
    "name": "Nome do Template"
  },
  "campaignId": "campaign_456"
}
```

### **Variáveis Disponíveis:**
- `{nome}`: Nome do contato ou sessão
- `{telefone}`: Telefone do contato
- `{saudacao}`: Saudação automática baseada no horário

---

## 🎯 Benefícios das Mudanças

### **1. Maior Flexibilidade:**
- Intervalos muito curtos para aquecimento intensivo
- Configurações específicas por campanha
- Sem limitações globais restritivas

### **2. Facilidade de Uso:**
- Importação em lote via JSON
- Templates organizados e nomeados
- Controle granular de ativação

### **3. Escalabilidade:**
- Suporte a centenas de templates por campanha
- Validação robusta de dados
- Performance otimizada para grandes volumes

---

**🎉 Sistema atualizado e pronto para uso com máxima flexibilidade e facilidade de gerenciamento!**
