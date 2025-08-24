# 📥 Documentação: Importação de Mensagens em JSON

## Visão Geral

O sistema de warmup permite importar templates de mensagens em formato JSON para facilitar a configuração em massa de campanhas. Esta funcionalidade é especialmente útil para:

- **Migração de dados**: Transferir templates entre campanhas ou sistemas
- **Configuração rápida**: Adicionar múltiplas mensagens de uma só vez
- **Backup e restauração**: Salvar e restaurar configurações de templates
- **Padronização**: Aplicar um conjunto padrão de mensagens em múltiplas campanhas

---

## 🔗 Endpoint de Importação

**Endpoint:** `POST /warmup/campaigns/{campaignId}/templates/import`

**Autenticação:** Bearer Token JWT

**Permissões:** `WARMUP_CAMPAIGNS` (write)

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## 📋 Formato do JSON

### Estrutura Básica

```json
{
  "templates": [
    {
      "name": "Saudação Matinal",
      "content": "Bom dia {nome}! Como você está hoje?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Pergunta Casual",
      "content": "Oi {nome}! Tudo bem? Como foi seu final de semana?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    }
  ],
  "replaceExisting": false
}
```

### Campos Obrigatórios

#### Para cada template:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `name` | string | Nome identificador do template | ✅ Sim |
| `content` | string | Conteúdo da mensagem com variáveis | ✅ Sim |
| `messageType` | string | Tipo de mensagem | ❌ Não (padrão: "text") |
| `weight` | number | Peso para seleção aleatória (1-10) | ❌ Não (padrão: 1) |
| `isActive` | boolean | Se o template está ativo | ❌ Não (padrão: true) |

#### Para a estrutura principal:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `templates` | array | Array de templates para importar | ✅ Sim |
| `replaceExisting` | boolean | Se deve substituir templates existentes | ❌ Não (padrão: false) |

---

## 🎯 Tipos de Mensagem Suportados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `text` | Mensagem de texto simples | "Oi {nome}! Como vai?" |
| `image` | Mensagem com imagem (futuro) | Texto + imagem anexa |
| `audio` | Mensagem de áudio (futuro) | Texto + áudio anexo |
| `video` | Mensagem de vídeo (futuro) | Texto + vídeo anexo |
| `document` | Mensagem com documento (futuro) | Texto + documento anexo |

> **Nota:** Atualmente apenas mensagens de texto são totalmente suportadas. Suporte a mídia será adicionado em versões futuras.

---

## 🔧 Variáveis Disponíveis

As mensagens podem conter variáveis que são substituídas automaticamente:

### Variáveis de Contato

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{nome}` | Nome do contato ou sessão | "João Silva" |
| `{telefone}` | Número de telefone | "+5511999999999" |
| `{email}` | Email do contato | "joao@exemplo.com" |

### Variáveis de Tempo

| Variável | Descrição | Valores Possíveis |
|----------|-----------|-------------------|
| `{saudacao}` | Saudação baseada no horário | "Bom dia", "Boa tarde", "Boa noite" |

### Exemplo de Uso

```json
{
  "name": "Saudação Personalizada",
  "content": "{saudacao} {nome}! Como você está? Espero que esteja tudo bem com você e sua família. Qualquer coisa, me chama no {telefone}!"
}
```

**Resultado após personalização:**
```
"Bom dia João Silva! Como você está? Espero que esteja tudo bem com você e sua família. Qualquer coisa, me chama no +5511999999999!"
```

---

## ⚖️ Sistema de Pesos

O campo `weight` controla a probabilidade de um template ser selecionado:

- **Peso 1**: Baixa probabilidade
- **Peso 5**: Probabilidade média  
- **Peso 10**: Alta probabilidade

### Exemplo Prático

```json
{
  "templates": [
    {
      "name": "Saudação Comum",
      "content": "Oi {nome}!",
      "weight": 5
    },
    {
      "name": "Saudação Especial", 
      "content": "Oi {nome}! Como vai meu amigo?",
      "weight": 2
    },
    {
      "name": "Saudação Formal",
      "content": "Olá {nome}, tudo bem?",
      "weight": 8
    }
  ]
}
```

Neste exemplo:
- "Saudação Formal" será mais usada (peso 8)
- "Saudação Comum" será moderadamente usada (peso 5)
- "Saudação Especial" será menos usada (peso 2)

---

## 🔄 Modo de Substituição

### `replaceExisting: false` (Padrão)

- **Comportamento**: Adiciona novos templates aos existentes
- **Templates existentes**: Permanecem ativos
- **Uso recomendado**: Expandir biblioteca de mensagens

### `replaceExisting: true`

- **Comportamento**: Desativa todos os templates existentes e adiciona os novos
- **Templates existentes**: Tornam-se inativos
- **Uso recomendado**: Substituição completa da biblioteca

---

## 📝 Exemplos Completos

### Exemplo 1: Mensagens Casuais

```json
{
  "templates": [
    {
      "name": "Saudação Simples",
      "content": "Oi {nome}! {saudacao}, como você está?",
      "messageType": "text",
      "weight": 5,
      "isActive": true
    },
    {
      "name": "Pergunta do Dia",
      "content": "E aí {nome}! Como foi seu dia hoje?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Mensagem de Apoio",
      "content": "{saudacao} {nome}! Espero que você esteja bem. Qualquer coisa, pode contar comigo!",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    },
    {
      "name": "Conversa sobre Trabalho",
      "content": "Oi {nome}! Como andam as coisas no trabalho? Espero que esteja tudo correndo bem!",
      "messageType": "text",
      "weight": 4,
      "isActive": true
    },
    {
      "name": "Mensagem de Final de Semana",
      "content": "{saudacao} {nome}! Como foi seu final de semana? Fez algo legal?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    }
  ],
  "replaceExisting": false
}
```

### Exemplo 2: Mensagens Comerciais (Sutis)

```json
{
  "templates": [
    {
      "name": "Pergunta sobre Negócios",
      "content": "Oi {nome}! Como andam os negócios por aí? Tudo correndo bem?",
      "messageType": "text",
      "weight": 4,
      "isActive": true
    },
    {
      "name": "Conversa sobre Vendas",
      "content": "{saudacao} {nome}! Como estão as vendas este mês? Espero que esteja indo bem!",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    },
    {
      "name": "Apoio Profissional",
      "content": "Oi {nome}! Se precisar de alguma coisa para o seu negócio, pode contar comigo, ok?",
      "messageType": "text",
      "weight": 2,
      "isActive": true
    }
  ],
  "replaceExisting": false
}
```

### Exemplo 3: Conversas Internas entre Sessões

```json
{
  "templates": [
    {
      "name": "Conversa entre Equipes",
      "content": "Oi {nome}! Como estão as coisas por aí no setor de vocês?",
      "messageType": "text",
      "weight": 5,
      "isActive": true
    },
    {
      "name": "Coordenação de Trabalho",
      "content": "{saudacao} {nome}! Vamos alinhar aqueles projetos hoje à tarde?",
      "messageType": "text",
      "weight": 4,
      "isActive": true
    },
    {
      "name": "Conversa Informal",
      "content": "E aí {nome}! Viu as novidades do sistema? Está funcionando bem por aí?",
      "messageType": "text",
      "weight": 3,
      "isActive": true
    }
  ],
  "replaceExisting": true
}
```

---

## 📤 Resposta da API

### Sucesso (200)

```json
{
  "message": "Templates import completed",
  "summary": {
    "totalImported": 5,
    "successfulImports": 5,
    "failedImports": 0,
    "replaceExisting": false,
    "totalActiveTemplates": 12
  },
  "createdTemplates": [
    {
      "id": "template_abc123",
      "name": "Saudação Simples",
      "content": "Oi {nome}! {saudacao}, como você está?",
      "messageType": "text",
      "weight": 5,
      "isActive": true
    }
    // ... outros templates criados
  ]
}
```

### Erro Parcial (200 com erros)

```json
{
  "message": "Templates import completed",
  "summary": {
    "totalImported": 3,
    "successfulImports": 2,
    "failedImports": 1,
    "replaceExisting": false,
    "totalActiveTemplates": 8
  },
  "createdTemplates": [
    // ... templates criados com sucesso
  ],
  "errors": [
    {
      "template": "Template Inválido",
      "error": "Content cannot be empty"
    }
  ]
}
```

---

## ⚠️ Validações e Limitações

### Validações Aplicadas

1. **Nome obrigatório**: Cada template deve ter um nome não vazio
2. **Conteúdo obrigatório**: Cada template deve ter conteúdo não vazio
3. **Peso válido**: Entre 1 e 10 (valores fora desta faixa são ajustados)
4. **Array não vazio**: Deve haver pelo menos 1 template
5. **Tipos válidos**: messageType deve ser um dos tipos suportados

### Limitações Atuais

- **Máximo de templates**: Sem limite técnico, mas recomenda-se até 50 por campanha
- **Tamanho do conteúdo**: Até 4096 caracteres por mensagem
- **Tipos de mídia**: Apenas "text" totalmente suportado
- **Variáveis**: Limitadas às listadas na documentação

### Tratamento de Erros

- **Templates inválidos**: São ignorados, válidos são importados
- **Nomes duplicados**: Permitido (diferenciados por ID único)
- **Conteúdo duplicado**: Permitido
- **Campaig não encontrada**: Retorna erro 404

---

## 🚀 Exemplo Prático via cURL

```bash
# Importar templates para uma campanha
curl -X POST "http://localhost:4000/warmup/campaigns/campaign_123/templates/import" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templates": [
      {
        "name": "Saudação Matinal",
        "content": "Bom dia {nome}! Como você está hoje?",
        "messageType": "text",
        "weight": 5,
        "isActive": true
      },
      {
        "name": "Pergunta Casual",
        "content": "Oi {nome}! Tudo bem? Como foi seu final de semana?",
        "messageType": "text",
        "weight": 3,
        "isActive": true
      }
    ],
    "replaceExisting": false
  }'
```

---

## 📊 Monitoramento de Uso

Após a importação, você pode monitorar o uso dos templates através de:

### 1. Listar Templates com Estatísticas

```bash
GET /warmup/campaigns/{campaignId}/templates
```

### 2. Estatísticas da Campanha

```bash
GET /warmup/campaigns/{campaignId}/statistics
```

### 3. Histórico de Execuções

```bash
GET /warmup/campaigns/{campaignId}/executions
```

---

## 💡 Dicas e Boas Práticas

### 1. Criação de Conteúdo

- **Seja natural**: Escreva como uma conversa real
- **Varie o tom**: Misture formal e informal
- **Use variáveis**: Personalize sempre que possível
- **Evite spam**: Não seja muito comercial

### 2. Gestão de Pesos

- **Mensagens comuns**: Peso 3-5
- **Mensagens especiais**: Peso 1-2  
- **Mensagens frequentes**: Peso 6-8
- **Teste e ajuste**: Monitore o uso e ajuste

### 3. Organização

- **Nomes descritivos**: Use nomes que identifiquem o propósito
- **Categorize**: Agrupe por tema ou ocasião
- **Documente**: Mantenha um registro das suas mensagens

### 4. Segurança

- **Backup regular**: Exporte seus templates periodicamente
- **Teste primeiro**: Importe em campanha de teste
- **Monitore resultados**: Acompanhe as métricas de entrega

---

## 🔧 Troubleshooting

### Problema: Import falha completamente

**Possíveis causas:**
- Token JWT inválido
- Campanha não encontrada
- JSON malformado

**Solução:**
```bash
# Verifique o token
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:4000/auth/profile

# Verifique se a campanha existe  
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:4000/warmup/campaigns/campaign_123
```

### Problema: Alguns templates não são importados

**Possíveis causas:**
- Nome ou conteúdo vazio
- Formato JSON inválido

**Solução:**
- Verifique a resposta da API para ver os erros específicos
- Valide o JSON antes de enviar

### Problema: Templates não aparecem no sistema

**Possíveis causas:**
- Templates importados como inativos
- Cache do frontend

**Solução:**
```bash
# Listar todos os templates (incluindo inativos)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:4000/warmup/campaigns/campaign_123/templates?active=false"
```

---

**Última atualização:** 19 de agosto de 2025  
**Versão da API:** 2.0  
**Status:** ✅ Implementado e testado
