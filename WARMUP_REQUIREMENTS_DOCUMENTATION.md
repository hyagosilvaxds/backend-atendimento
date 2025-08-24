# 🚀 Documentação: Requisitos para Iniciar um Warmup

## Visão Geral

Para que uma campanha de warmup funcione corretamente e comece a aquecer os números WhatsApp, é necessário configurar todos os componentes essenciais. Este documento detalha os **requisitos obrigatórios** e **configurações recomendadas** para uma campanha de aquecimento eficaz.

---

## ✅ Checklist de Requisitos Obrigatórios

### 1. 📱 Sessões WhatsApp (OBRIGATÓRIO)

**Mínimo:** 1 sessão  
**Recomendado:** 2+ sessões para conversas internas

#### Requisitos para cada sessão:
- ✅ Sessão conectada e ativa (`status: "connected"`)
- ✅ Número WhatsApp válido e verificado
- ✅ Sessão pertencente à organização
- ✅ Sem campanhas de warmup ativas conflitantes

#### Como verificar:
```bash
# Listar sessões disponíveis
GET /whatsapp/sessions

# Verificar status de uma sessão específica
GET /whatsapp/sessions/{sessionId}/status
```

#### Estados válidos:
- `"connected"` ✅ Pronto para usar
- `"connecting"` ⚠️ Aguardar conexão
- `"disconnected"` ❌ Não pode ser usado
- `"error"` ❌ Precisa ser reconectado

---

### 2. 👥 Contatos (OBRIGATÓRIO para mensagens externas)

**Mínimo:** 1 contato  
**Recomendado:** 10+ contatos ativos

#### Requisitos para cada contato:
- ✅ Número de telefone válido (formato internacional)
- ✅ Contato ativo (`isActive: true`)
- ✅ Contato pertencente à organização
- ✅ Número WhatsApp existente e ativo

#### Como verificar:
```bash
# Listar contatos disponíveis
GET /contacts

# Verificar contatos da campanha
GET /warmup/campaigns/{campaignId}/contacts
```

#### Qualidade dos contatos:
- **Excelente**: Contatos que respondem mensagens
- **Bom**: Contatos que leem mensagens
- **Regular**: Contatos que recebem mensagens
- **Ruim**: Números inexistentes ou bloqueados

---

### 3. 📝 Templates de Mensagem (OBRIGATÓRIO)

**Mínimo:** 3 templates ativos  
**Recomendado:** 8+ templates variados

#### Requisitos para templates:
- ✅ Pelo menos 3 templates ativos
- ✅ Conteúdo natural e conversacional
- ✅ Uso de variáveis para personalização
- ✅ Diferentes estilos e tons

#### Como criar templates:
```bash
# Criar template individual
POST /warmup/campaigns/{campaignId}/templates

# Importar múltiplos templates via JSON
POST /warmup/campaigns/{campaignId}/templates/import
```

#### Exemplos de templates essenciais:
```json
{
  "templates": [
    {
      "name": "Saudação Matinal",
      "content": "{saudacao} {nome}! Como você está hoje?",
      "weight": 5
    },
    {
      "name": "Pergunta Casual",
      "content": "Oi {nome}! Tudo bem por aí?",
      "weight": 4
    },
    {
      "name": "Mensagem de Apoio",
      "content": "E aí {nome}! Espero que esteja tudo bem com você!",
      "weight": 3
    }
  ]
}
```

---

### 4. ⚙️ Configurações da Campanha

#### Configurações obrigatórias:
- ✅ **Nome da campanha**: Identificação clara
- ✅ **Meta diária**: Entre 1 e 100 mensagens por sessão
- ✅ **Intervalos**: Tempo mínimo e máximo entre mensagens

#### Configurações recomendadas por fase:

##### 🌱 **Fase Inicial (Números Novos)**
```json
{
  "dailyMessageGoal": 10,
  "minIntervalMinutes": 30,
  "maxIntervalMinutes": 90,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.6,
  "useWorkingHours": true,
  "allowWeekends": false
}
```

##### 🌿 **Fase Intermediária (1-2 semanas)**
```json
{
  "dailyMessageGoal": 25,
  "minIntervalMinutes": 20,
  "maxIntervalMinutes": 60,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.4,
  "useWorkingHours": true,
  "allowWeekends": false
}
```

##### 🌳 **Fase Avançada (Números aquecidos)**
```json
{
  "dailyMessageGoal": 50,
  "minIntervalMinutes": 10,
  "maxIntervalMinutes": 45,
  "enableInternalConversations": true,
  "internalConversationRatio": 0.2,
  "useWorkingHours": false,
  "allowWeekends": true
}
```

---

## 🔧 Configurações Detalhadas

### Intervalos entre Mensagens

| Intervalo | Recomendação | Risco |
|-----------|--------------|-------|
| < 5 minutos | ⚠️ Alto risco | Pode parecer spam |
| 5-15 minutos | ✅ Bom | Seguro para números aquecidos |
| 15-30 minutos | ✅ Ideal | Recomendado para início |
| 30-60 minutos | ✅ Conservador | Muito seguro |
| > 60 minutos | ⚠️ Muito lento | Aquecimento demorado |

### Horários de Funcionamento

#### Configuração recomendada:
```json
{
  "useWorkingHours": true,
  "workingHourStart": 8,    // 8:00
  "workingHourEnd": 18,     // 18:00
  "allowWeekends": false    // Apenas dias úteis
}
```

#### Horários por segmento:
- **B2B**: 8:00-18:00, sem fins de semana
- **B2C**: 9:00-21:00, incluir fins de semana
- **Casual**: 7:00-22:00, incluir fins de semana

---

## 🎯 Configurações Avançadas

### Conversas Internas (Altamente Recomendado)

Para campanhas com **2+ sessões**, configure conversas internas:

```json
{
  "enableInternalConversations": true,
  "internalConversationRatio": 0.3  // 30% das mensagens são internas
}
```

#### Benefícios:
- ✅ Simula conversas naturais entre números conhecidos
- ✅ Melhora a reputação de ambos os números
- ✅ Reduz dependência de contatos externos
- ✅ Acelera o processo de aquecimento

#### Proporções recomendadas:
- **Números novos**: 60% internas, 40% externas
- **Números em aquecimento**: 40% internas, 60% externas  
- **Números aquecidos**: 20% internas, 80% externas

---

## 📊 Verificação de Pré-requisitos

### Endpoint de Validação

Use este endpoint para verificar se uma campanha está pronta:

```bash
GET /warmup/campaigns/{campaignId}/readiness-check
```

### Resposta de exemplo:

```json
{
  "isReady": true,
  "readinessScore": 95,
  "checks": {
    "sessions": {
      "status": "passed",
      "count": 3,
      "required": 1,
      "details": "3 sessions connected and ready"
    },
    "contacts": {
      "status": "passed", 
      "count": 25,
      "required": 1,
      "details": "25 active contacts available"
    },
    "templates": {
      "status": "passed",
      "count": 8,
      "required": 3,
      "details": "8 active templates configured"
    },
    "configuration": {
      "status": "passed",
      "details": "All settings configured properly"
    }
  },
  "warnings": [
    "Consider adding more templates for better variety"
  ],
  "recommendations": [
    "Enable internal conversations for better warming",
    "Add more contacts to improve engagement"
  ]
}
```

---

## ⚠️ Problemas Comuns e Soluções

### 1. Campanha não inicia execuções

**Possíveis causas:**
- ❌ Nenhuma sessão conectada
- ❌ Nenhum template ativo
- ❌ Nenhum contato disponível
- ❌ Horário fora do permitido

**Verificação:**
```bash
# Verificar status da campanha
GET /warmup/campaigns/{campaignId}

# Verificar último erro
GET /warmup/campaigns/{campaignId}/executions?status=failed&limit=5
```

**Solução:**
1. Verificar conexão das sessões
2. Ativar templates
3. Adicionar contatos válidos
4. Ajustar horários de funcionamento

### 2. Baixa taxa de entrega

**Possíveis causas:**
- ❌ Números de contatos inválidos
- ❌ Números bloqueados ou inexistentes
- ❌ Sessão com problemas

**Solução:**
1. Validar qualidade dos contatos
2. Remover números problemáticos
3. Reconectar sessões WhatsApp

### 3. Health Score baixo

**Possíveis causas:**
- ❌ Muitas mensagens muito rápido
- ❌ Contatos de baixa qualidade
- ❌ Templates muito repetitivos

**Solução:**
1. Aumentar intervalos entre mensagens
2. Melhorar base de contatos
3. Adicionar mais templates variados

---

## 📈 Monitoramento e Otimização

### Métricas Essenciais

Monitor estas métricas para garantir sucesso:

1. **Health Score**: Manter acima de 70%
2. **Taxa de Entrega**: Manter acima de 95%
3. **Taxa de Leitura**: Manter acima de 60%
4. **Execuções por Hora**: Conforme configurado

### Dashboard de Monitoramento

```bash
# Visão geral
GET /warmup/dashboard

# Estatísticas da campanha
GET /warmup/campaigns/{campaignId}/statistics

# Relatório de saúde
GET /warmup/health-report
```

---

## 🚀 Exemplo Completo: Criando Campanha Pronta

### Passo 1: Verificar Recursos Disponíveis

```bash
# Listar sessões conectadas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/whatsapp/sessions?status=connected"

# Listar contatos ativos  
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/contacts?isActive=true&limit=50"
```

### Passo 2: Criar Campanha com Configuração Inicial

```bash
curl -X POST "http://localhost:4000/warmup/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aquecimento Inicial - Vendas",
    "description": "Campanha de aquecimento para números novos",
    "dailyMessageGoal": 15,
    "enableInternalConversations": true,
    "internalConversationRatio": 0.5,
    "minIntervalMinutes": 25,
    "maxIntervalMinutes": 60,
    "useWorkingHours": true,
    "workingHourStart": 8,
    "workingHourEnd": 18,
    "allowWeekends": false,
    "randomizeInterval": true,
    "sessionIds": ["session_1", "session_2"],
    "contactIds": ["contact_1", "contact_2", "contact_3"]
  }'
```

### Passo 3: Importar Templates

```bash
curl -X POST "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID/templates/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "Saudação Matinal",
        "content": "{saudacao} {nome}! Como você está hoje?",
        "weight": 5
      },
      {
        "name": "Pergunta Casual",
        "content": "Oi {nome}! Tudo bem? Como foi seu final de semana?",
        "weight": 4
      },
      {
        "name": "Mensagem de Apoio",
        "content": "E aí {nome}! Espero que esteja tudo bem com você!",
        "weight": 3
      },
      {
        "name": "Conversa sobre Trabalho",
        "content": "Oi {nome}! Como andam as coisas no trabalho?",
        "weight": 4
      },
      {
        "name": "Saudação da Tarde",
        "content": "Boa tarde {nome}! Como está sendo seu dia?",
        "weight": 4
      }
    ],
    "replaceExisting": false
  }'
```

### Passo 4: Verificar se está Pronto

```bash
# Verificar configuração
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/warmup/campaigns/$CAMPAIGN_ID"

# A campanha deve estar com isActive: true e começar a funcionar automaticamente
```

---

## 📋 Checklist Final

Antes de iniciar uma campanha, confirme:

### ✅ Sessões WhatsApp
- [ ] Pelo menos 1 sessão conectada
- [ ] Sessões pertencem à organização
- [ ] Status "connected" confirmado

### ✅ Contatos
- [ ] Pelo menos 10 contatos ativos
- [ ] Números em formato internacional
- [ ] Contatos verificados como WhatsApp válidos

### ✅ Templates
- [ ] Pelo menos 5 templates ativos
- [ ] Conteúdo natural e variado
- [ ] Variáveis configuradas ({nome}, {saudacao})

### ✅ Configurações
- [ ] Meta diária apropriada (10-50 mensagens)
- [ ] Intervalos seguros (15+ minutos para início)
- [ ] Horários de funcionamento definidos
- [ ] Conversas internas habilitadas (se 2+ sessões)

### ✅ Monitoramento
- [ ] Dashboard configurado
- [ ] Alertas de saúde ativados
- [ ] Processo de backup definido

---

## 💡 Dicas para Sucesso

### 1. Comece Devagar
- Inicie com metas baixas (10-15 mensagens/dia)
- Use intervalos maiores (30+ minutos)
- Monitore health score diariamente

### 2. Monitore Constantemente
- Verifique execuções diárias
- Ajuste configurações baseado em métricas
- Pause se health score cair abaixo de 60%

### 3. Mantenha Naturalidade
- Use conversas humanas nos templates
- Varie horários e intervalos
- Misture conversas internas e externas

### 4. Escale Gradualmente
- Aumente meta diária semanalmente
- Reduza intervalos conforme melhora
- Adicione mais contatos progressivamente

---

**Última atualização:** 19 de agosto de 2025  
**Versão da API:** 2.0  
**Status:** ✅ Implementado e testado

**⚡ Lembre-se**: Uma campanha bem configurada desde o início tem muito mais chances de sucesso no aquecimento dos números WhatsApp!
