# 📋 Gerenciamento de Contatos em Campanhas de Aquecimento

## 📑 Índice
1. [Visão Geral](#visão-geral)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Adicionando Contatos](#adicionando-contatos)
4. [Removendo Contatos](#removendo-contatos)
5. [Listando Contatos](#listando-contatos)
6. [Envio de Mensagens Externas](#envio-de-mensagens-externas)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Status do Sistema](#status-do-sistema)

---

## 🎯 Visão Geral

O sistema de aquecimento do WhatsApp suporta **dois tipos de conversas**:

### 🔄 Conversas Internas
- **Definição**: Mensagens trocadas entre diferentes sessões do WhatsApp da mesma organização
- **Propósito**: Simular atividade natural entre números da empresa
- **Configuração**: Controlado pelo parâmetro `enableInternalConversations` e `internalConversationRatio`

### 🌐 Conversas Externas  
- **Definição**: Mensagens enviadas para contatos externos (clientes reais)
- **Propósito**: Aquecimento real com bases de dados de clientes
- **Configuração**: Gerenciado através dos endpoints de contatos da campanha

---

## 🔗 Endpoints Disponíveis

### 1. Adicionar Contatos à Campanha
```http
POST /warmup/campaigns/{campaignId}/contacts
```

### 2. Remover Contato da Campanha
```http
DELETE /warmup/campaigns/{campaignId}/contacts/{contactId}
```

### 3. Listar Contatos da Campanha
```http
GET /warmup/campaigns/{campaignId}/contacts
```

---

## ➕ Adicionando Contatos

### Request
```bash
curl -X POST "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contactIds": ["contact_id_1", "contact_id_2"],
    "priority": 1
  }'
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `contactIds` | `string[]` | ✅ | Array com IDs dos contatos a serem adicionados |
| `priority` | `number` | ❌ | Prioridade do contato (padrão: 1) |

### Response de Sucesso
```json
{
  "message": "Contatos adicionados com sucesso",
  "data": [
    {
      "id": "cmeiphrqn001cvbi2ytc7xyas",
      "campaignId": "cmehwum5x0003vbs280umm0f7",
      "contactId": "cmehfu4cy0001vbvzdi43hr16",
      "isActive": true,
      "priority": 1,
      "createdAt": "2025-08-19T15:36:13.487Z"
    }
  ]
}
```

### Validações
- ✅ Contatos devem existir na organização
- ✅ Contatos devem estar ativos (`isActive: true`)
- ✅ Campanha deve existir e pertencer à organização
- ✅ Sistema previne duplicatas usando `upsert`

---

## ➖ Removendo Contatos

### Request
```bash
curl -X DELETE "http://localhost:4000/warmup/campaigns/{campaignId}/contacts/{contactId}" \
  -H "Authorization: Bearer {token}"
```

### Parâmetros da URL

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `campaignId` | `string` | ID da campanha de aquecimento |
| `contactId` | `string` | ID do contato a ser removido |

### Response de Sucesso
```json
{
  "message": "Contato removido da campanha com sucesso"
}
```

### Comportamento
- ❌ Remove completamente a associação do contato com a campanha
- 🔄 Execuções já agendadas **não são canceladas**
- ⚠️ Novas execuções para este contato **não serão criadas**

---

## 📋 Listando Contatos

### Request
```bash
curl -X GET "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}"
```

### Response
```json
{
  "data": [
    {
      "id": "cmehfu4cy0001vbvzdi43hr16",
      "name": "João Silva",
      "phone": "11999999999",
      "lastInteraction": "2025-08-19T14:30:00.000Z",
      "interactionCount": 5,
      "averageResponseTime": 3600
    }
  ]
}
```

### Estatísticas Incluídas

| Campo | Descrição |
|-------|-----------|
| `lastInteraction` | Data/hora da última mensagem enviada para o contato |
| `interactionCount` | Total de mensagens enviadas para este contato na campanha |
| `averageResponseTime` | Tempo médio de resposta em segundos (padrão: 3600) |

---

## 🌐 Envio de Mensagens Externas

### Como Funciona

1. **🎲 Seleção Aleatória**: O sistema seleciona um contato aleatório da campanha
2. **⚖️ Sistema de Pesos**: Contatos com maior prioridade têm maior chance de serem selecionados
3. **📝 Template Random**: Escolhe um template de mensagem aleatório
4. **🔄 Personalização**: Substitui variáveis como `{nome}` pelos dados do contato
5. **⏰ Agendamento**: Respeita intervalos e horários configurados

### Configuração de Prioridade

```typescript
// Exemplo de distribuição de peso
const weightedContacts = campaignContacts.flatMap(cc => 
  Array(cc.priority || 1).fill(cc.contact)
);
```

- **Prioridade 1**: 1x chance de seleção
- **Prioridade 2**: 2x chance de seleção  
- **Prioridade 3**: 3x chance de seleção

### Lógica de Decisão

```typescript
// Primeiro tenta conversa interna
const shouldUseInternalConversation = 
  campaign.enableInternalConversations && 
  campaign.campaignSessions.length > 1 &&
  Math.random() < campaign.internalConversationRatio;

// Se não for interna, usa contatos externos
if (!shouldUseInternalConversation) {
  const contact = selectRandomContact(campaign.campaignContacts);
  // ... processa envio externo
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Configurando Campanha Mista

```bash
# 1. Criar campanha com configuração balanceada
curl -X POST "http://localhost:4000/warmup/campaigns" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aquecimento Misto",
    "enableInternalConversations": true,
    "internalConversationRatio": 0.3,
    "dailyMessageGoal": 100
  }'

# 2. Adicionar contatos externos
curl -X POST "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contactIds": ["contact1", "contact2", "contact3"],
    "priority": 1
  }'
```

**Resultado**: 30% conversas internas + 70% conversas externas

### Exemplo 2: Campanha Focada em Contatos VIP

```bash
# Adicionar contatos VIP com alta prioridade
curl -X POST "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contactIds": ["vip_contact_1", "vip_contact_2"],
    "priority": 3
  }'

# Adicionar contatos normais com prioridade baixa
curl -X POST "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contactIds": ["normal_contact_1", "normal_contact_2"],
    "priority": 1
  }'
```

**Resultado**: Contatos VIP têm 3x mais chance de receber mensagens

### Exemplo 3: Limpeza de Contatos Inativos

```bash
# 1. Listar todos os contatos da campanha
curl -X GET "http://localhost:4000/warmup/campaigns/{campaignId}/contacts" \
  -H "Authorization: Bearer {token}"

# 2. Remover contatos específicos
curl -X DELETE "http://localhost:4000/warmup/campaigns/{campaignId}/contacts/{contactId}" \
  -H "Authorization: Bearer {token}"
```

---

## ✅ Status do Sistema

### 🔄 Funcionalidades Testadas e Funcionando

| Feature | Status | Descrição |
|---------|--------|-----------|
| ✅ Adicionar Contatos | **FUNCIONANDO** | Múltiplos contatos podem ser adicionados simultaneamente |
| ✅ Remover Contatos | **FUNCIONANDO** | Remoção individual por ID funciona corretamente |
| ✅ Listar Contatos | **FUNCIONANDO** | Lista com estatísticas detalhadas |
| ✅ Validação de Permissões | **FUNCIONANDO** | Apenas contatos da organização podem ser adicionados |
| ✅ Prevenção de Duplicatas | **FUNCIONANDO** | Sistema usa `upsert` para evitar duplicações |
| ✅ Sistema de Prioridades | **FUNCIONANDO** | Pesos são aplicados na seleção aleatória |

### ⚠️ Comportamento Observado

**Envio de Mensagens Externas**: Durante os testes, observamos que a campanha está priorizando **conversas internas** sobre **conversas externas**. Isso acontece porque:

1. **`internalConversationRatio`** está configurado (padrão ou alto)
2. **Existem múltiplas sessões** na campanha (2 sessões ativas)
3. **Sistema prioriza** conversas internas quando ambas as condições são atendidas

### 🔧 Ajustes Recomendados

Para **forçar mais mensagens externas**, ajuste a configuração da campanha:

```bash
curl -X PATCH "http://localhost:4000/warmup/campaigns/{campaignId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "internalConversationRatio": 0.1
  }'
```

Isso fará com que apenas **10% das mensagens** sejam internas e **90% sejam externas**.

---

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **📊 Dashboard de Contatos**
   - Visualização gráfica das interações
   - Relatórios de performance por contato

2. **🎯 Segmentação Avançada**
   - Grupos de contatos por tags
   - Horários específicos por segmento

3. **📈 Analytics Avançados**
   - Taxa de resposta por contato
   - Tempo médio de engajamento
   - Análise de sucesso por tipo de mensagem

4. **🔄 Auto-balanceamento**
   - Ajuste automático de prioridades baseado em performance
   - Exclusão automática de contatos inativos

---

## 📞 Suporte

Para dúvidas ou problemas com o gerenciamento de contatos:

1. **Verificar logs**: Console do servidor mostra detalhes das execuções
2. **Testar endpoints**: Use os exemplos fornecidos
3. **Verificar permissões**: Certifique-se de que o token tem acesso à organização

---

*Documentação atualizada em: 19 de agosto de 2025*
