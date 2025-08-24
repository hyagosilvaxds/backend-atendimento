# Sistema de Autopause - Campanhas de Aquecimento

## Visão Geral

O Sistema de Autopause é uma funcionalidade avançada que permite pausas automáticas e inteligentes durante as campanhas de aquecimento de WhatsApp. O sistema simula comportamento humano real ao introduzir pausas variáveis baseadas em tempo de conversa, proporcionando maior naturalidade às interações e melhor proteção contra detecção de automação.

## Objetivos

- **Simular Comportamento Humano**: Introduzir pausas naturais nas conversas como um usuário real faria
- **Proteção Anti-Spam**: Reduzir o risco de detecção de automação pelo WhatsApp
- **Gestão Inteligente de Timing**: Controlar automaticamente o ritmo das conversas
- **Melhoria da Deliverability**: Aumentar a taxa de entrega das mensagens através de padrões mais naturais

## Funcionalidades Principais

### 1. Configuração por Campanha
Cada campanha pode ter configurações específicas de autopause:

```typescript
{
  enableAutoPauses: boolean,           // Habilitar/desabilitar autopause
  maxPauseTimeMinutes: number,         // Tempo máximo de pausa (5-240 min)
  minConversationTimeMinutes: number   // Tempo mínimo antes da pausa (5-480 min)
}
```

### 2. Controle por Sessão
O sistema rastreia individualmente cada sessão de WhatsApp:

```typescript
{
  currentPauseUntil: DateTime,         // Quando a pausa atual termina
  lastConversationStart: DateTime,     // Início da última conversa
  conversationStartedAt: DateTime      // Início da conversa atual
}
```

### 3. Algoritmo de Pausa Inteligente

#### Verificação de Tempo de Conversa
- Monitora o tempo decorrido desde o início da conversa atual
- Compara com o tempo mínimo configurado (`minConversationTimeMinutes`)
- Só aplica pausa após atingir o tempo mínimo

#### Cálculo de Pausa Randomizada
```typescript
const pauseTimeMinutes = Math.floor(Math.random() * maxPauseTimeMinutes) + 1;
```
- Gera pausas aleatórias entre 1 minuto e o máximo configurado
- Adiciona imprevisibilidade ao comportamento

#### Delay Adicional Pós-Pausa
```typescript
const additionalDelay = Math.floor(Math.random() * 300) + 60; // 1-5 minutos
```
- Adiciona delay extra após o fim da pausa oficial
- Evita retomada muito mecânica das conversas

## Estrutura do Banco de Dados

### Tabela: WarmupCampaign
```sql
enableAutoPauses           BOOLEAN DEFAULT false
maxPauseTimeMinutes        INTEGER DEFAULT 30
minConversationTimeMinutes INTEGER DEFAULT 20
```

### Tabela: WarmupCampaignSession
```sql
currentPauseUntil     TIMESTAMP NULL
lastConversationStart TIMESTAMP NULL
conversationStartedAt TIMESTAMP NULL
```

## API Endpoints

### 1. Criar Campanha com Autopause
```http
POST /warmup/campaigns
```

**Body:**
```json
{
  "name": "Campanha com Autopause",
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 45,
  "minConversationTimeMinutes": 30,
  "minIntervalMinutes": 5,
  "maxIntervalMinutes": 15
}
```

**Resposta:**
```json
{
  "id": "campaign_id",
  "name": "Campanha com Autopause",
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 45,
  "minConversationTimeMinutes": 30,
  "status": "ACTIVE"
}
```

### 2. Atualizar Configurações de Autopause
```http
PATCH /warmup/campaigns/{id}
```

**Body:**
```json
{
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 60,
  "minConversationTimeMinutes": 25
}
```

### 3. Testar Sistema de Autopause
```http
POST /warmup/campaigns/{id}/test-autopause
```

**Body:**
```json
{
  "sessionId": "session_id",
  "simulateConversationTime": 35
}
```

**Resposta:**
```json
{
  "pauseApplied": true,
  "pauseDurationMinutes": 23,
  "resumeAt": "2025-08-19T13:25:00.000Z",
  "conversationDuration": 35,
  "status": "paused"
}
```

### 4. Upload de Arquivos para Templates
```http
POST /warmup/campaigns/{id}/templates/with-file
```

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (multipart/form-data):**
```
file: [arquivo de imagem, vídeo, áudio ou documento]
content: "Mensagem que acompanha o arquivo"
weight: "3"
variables: "{\"tipo\": \"promocional\"}"
```

**Tipos de arquivo suportados:**
- **Imagens**: JPEG, PNG, GIF, WebP
- **Áudios**: MP3, WAV, OGG
- **Vídeos**: MP4, AVI, MOV
- **Documentos**: PDF, DOC, DOCX

**Resposta:**
```json
{
  "id": "template_id",
  "campaignId": "campaign_id",
  "content": "Mensagem que acompanha o arquivo",
  "messageType": "document",
  "weight": 3,
  "mediaFileId": "media_file_id",
  "mediaFile": {
    "id": "media_file_id",
    "fileName": "documento.pdf",
    "filePath": "uploads/warmup/random_name.pdf",
    "fileType": "document",
    "fileSize": 1024,
    "mimeType": "application/pdf"
  }
}
```

### 5. Listar Arquivos de Mídia
```http
GET /warmup/campaigns/{id}/media
```

**Resposta:**
```json
[
  {
    "id": "media_file_id",
    "fileName": "documento.pdf",
    "fileType": "document",
    "fileSize": 1024,
    "mimeType": "application/pdf",
    "createdAt": "2025-08-19T15:04:07.870Z",
    "templates": [
      {
        "id": "template_id",
        "content": "Mensagem que acompanha o arquivo",
        "weight": 3
      }
    ]
  }
]
```

### 6. Deletar Arquivo de Mídia
```http
DELETE /warmup/campaigns/{id}/media/{mediaId}
```

**Resposta:**
```json
{
  "message": "Arquivo de mídia removido com sucesso"
}
```

## Configurações Recomendadas

### Para Aquecimento Inicial (Novos Números)
```json
{
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 60,
  "minConversationTimeMinutes": 15,
  "minIntervalMinutes": 10,
  "maxIntervalMinutes": 30,
  "dailyMessageGoal": 1000
}
```

### Para Aquecimento Moderado
```json
{
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 45,
  "minConversationTimeMinutes": 20,
  "minIntervalMinutes": 5,
  "maxIntervalMinutes": 20,
  "dailyMessageGoal": 5000
}
```

### Para Números Já Aquecidos
```json
{
  "enableAutoPauses": true,
  "maxPauseTimeMinutes": 30,
  "minConversationTimeMinutes": 25,
  "minIntervalMinutes": 0,
  "maxIntervalMinutes": 15,
  "dailyMessageGoal": 10000
}
```

## Fluxo de Funcionamento

### 1. Início da Conversa
```
1. Sistema registra conversationStartedAt
2. Primeira mensagem é enviada normalmente
3. Timer de conversa é iniciado
```

### 2. Durante a Conversa
```
1. Cada nova mensagem verifica tempo decorrido
2. Se tempo < minConversationTimeMinutes: continua normal
3. Se tempo >= minConversationTimeMinutes: elegível para pausa
```

### 3. Aplicação da Pausa
```
1. Calcula pauseTimeMinutes aleatório
2. Define currentPauseUntil
3. Move conversationStartedAt para lastConversationStart
4. Para o agendamento de novas mensagens
```

### 4. Retomada da Conversa
```
1. Verifica se currentPauseUntil já passou
2. Adiciona delay adicional aleatório (1-5 min)
3. Reseta conversationStartedAt para nova conversa
4. Retoma agendamento normal
```

## Logs e Monitoramento

### Logs de Pausa
```
🛑 Pausa automática aplicada para sessão {sessionId}
⏰ Duração da pausa: {pauseTimeMinutes} minutos
🕒 Retorno previsto: {pauseUntil}
```

### Métricas Rastreadas
- Tempo total de conversa antes da pausa
- Duração das pausas aplicadas
- Número de pausas por sessão/dia
- Taxa de sucesso na retomada

## Integração com Frontend

### Indicadores Visuais
```json
{
  "sessionStatus": {
    "isInPause": true,
    "pauseUntil": "2025-08-19T13:25:00.000Z",
    "pauseRemainingMinutes": 15,
    "lastConversationDuration": 35
  }
}
```

### Dashboard de Pausas
- Timeline de pausas por sessão
- Distribuição de duração das pausas
- Efetividade das pausas (métricas de entrega)
- Comparativo com/sem autopause

## Validações e Restrições

### Limites de Configuração
```typescript
{
  dailyMessageGoal: {
    min: 1,
    max: 10000,
    default: 50
  },
  maxPauseTimeMinutes: {
    min: 5,
    max: 240,
    default: 30
  },
  minConversationTimeMinutes: {
    min: 5,
    max: 480,
    default: 20
  }
}
```

### Validações de Negócio
- `minConversationTimeMinutes` deve ser > 0 quando autopause ativo
- `maxPauseTimeMinutes` deve ser >= 5 minutos
- Não aplicar pausa se sessão já está pausada
- Não aplicar pausa fora do horário de trabalho

## Compatibilidade

### Com Outros Recursos
- ✅ **Intervalos Randomizados**: Funciona em conjunto
- ✅ **Horário de Trabalho**: Respeita configurações
- ✅ **Conversas Internas**: Aplicável a conversas entre sessões
- ✅ **Templates Ponderados**: Mantém lógica de seleção
- ✅ **Templates com Mídia**: Suporte completo a imagens, vídeos, áudios e documentos
- ✅ **Métricas de Saúde**: Integra com sistema de métricas

### Requisitos Técnicos
- **Versão Mínima**: Backend v2.1.0+
- **Banco de Dados**: PostgreSQL com campos de autopause
- **Cron Jobs**: Agendamento ativo para verificações
- **Memory**: ~10MB adicional por 1000 sessões ativas

## Troubleshooting

### Problema: Nome do Template Duplicado no Conteúdo
**Erro**: Template aparece como `[Nome Template] Conteúdo da mensagem`
**Causa**: Sistema estava adicionando o nome do template no início do conteúdo
**Solução**: 
1. Modificar `importTemplates()` para usar apenas `template.content`
2. Remover concatenação `[${template.name}] ${template.content}`
3. Reimportar templates existentes com `replaceExisting: true`

### Problema: Foreign Key Constraint Error
**Erro**: `warmup_health_metrics_campaignSessionId_fkey`
**Causa**: Tentativa de criar métricas com campaignSessionId inválido
**Solução**: 
1. Verificar se `campaignSessionId` existe antes de criar métricas
2. Usar o ID correto do `WarmupCampaignSession` ao invés do `WhatsAppSession.id`
3. Implementar tratamento de erro para não quebrar fluxo principal

### Problema: Pausas Muito Frequentes
**Causa**: `minConversationTimeMinutes` muito baixo
**Solução**: Aumentar para pelo menos 15-20 minutos

### Problema: Pausas Muito Longas
**Causa**: `maxPauseTimeMinutes` muito alto
**Solução**: Reduzir para 30-60 minutos máximo

### Problema: Sessão Não Retoma
**Verificar**:
1. Campo `currentPauseUntil` no banco
2. Logs do cron job de agendamento
3. Status da sessão WhatsApp
4. Configuração de horário de trabalho

### Problema: Comportamento Inconsistente
**Verificar**:
1. Fuso horário do servidor
2. Sincronização de timestamps
3. Overlapping de configurações
4. Cache de configurações

## Changelog

### v2.1.3 (2025-08-19)
- 🎯 **Nova Funcionalidade**: Suporte completo a templates com arquivos de mídia
- 📎 **Upload de Arquivos**: Endpoint para criar templates com imagens, vídeos, áudios e documentos
- 📋 **Gestão de Mídia**: Listagem e exclusão de arquivos de mídia por campanha
- 🔄 **Integração WhatsApp**: Envio automático de arquivos via Baileys durante o aquecimento
- 🗂️ **Tipos Suportados**: JPG, PNG, GIF, WebP, MP3, WAV, OGG, MP4, AVI, MOV, PDF, DOC, DOCX

## Changelog

### v2.1.3 (2025-08-19)
- 🚀 **Aumento de Capacidade**: Limite de mensagens diárias aumentado de 200 para 10.000 mensagens
- ✅ **Validação Atualizada**: DTO de campanhas agora aceita valores entre 1 e 10.000 para dailyMessageGoal
- 📈 **Escalabilidade**: Sistema preparado para campanhas de alto volume com autopause inteligente
- 📋 **Documentação**: Configurações recomendadas atualizadas com metas de mensagens apropriadas

### v2.1.2 (2025-08-19)
- 🔧 **Correção Template**: Removida duplicação do nome do template no conteúdo da mensagem
- ✅ **Import Melhorado**: Templates JSON agora usam apenas o campo `content` sem prefixo do nome
- 📋 **Limpeza**: Corrigida lógica de importação para não concatenar `[nome] conteúdo`

### v2.1.1 (2025-08-19)
- 🔧 **Correção Crítica**: Fixed foreign key constraint error em WarmupHealthMetric
- ✅ **Validação Melhorada**: Adicionada verificação de existência do campaignSessionId antes de criar métricas
- 🛡️ **Error Handling**: Implementado tratamento de erro robusto para evitar quebra do fluxo principal
- 📊 **Logs Aprimorados**: Melhorados logs de erro e debug para troubleshooting

### v2.1.0 (2025-08-19)
- ✅ Implementação inicial do sistema de autopause
- ✅ Campos de banco para controle de pausas
- ✅ API endpoints para configuração
- ✅ Integração com sistema de agendamento
- ✅ Logs e monitoramento básico

### Próximas Versões
- 🔄 Dashboard visual de pausas
- 🔄 Métricas avançadas de efetividade
- 🔄 Templates de configuração por tipo de campanha
- 🔄 Pausas baseadas em horário (almoço, final de expediente)
- 🔄 Machine Learning para otimização automática

## Suporte

Para dúvidas ou problemas com o sistema de autopause:

1. **Verificar logs**: Console do backend com filtro "🛑"
2. **Validar configuração**: Endpoint GET /warmup/campaigns/{id}
3. **Testar isoladamente**: Endpoint POST /warmup/campaigns/{id}/test-autopause
4. **Verificar banco**: Tabelas WarmupCampaign e WarmupCampaignSession

---

**Última atualização**: 19 de agosto de 2025  
**Versão da documentação**: 1.3  
**Compatibilidade**: Backend v2.1.3+
