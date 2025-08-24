# Auto-Read por Sessão de Aquecimento - Documentação

## Resumo das Mudanças

A configuração de auto-read foi **migrada de sessões WhatsApp para sessões de aquecimento**, permitindo controle mais granular e específico para campanhas de aquecimento.

## Principais Alterações

### 1. Schema do Banco de Dados
- **Removido** campos autoRead do modelo `WhatsAppSession`
- **Adicionado** campos autoRead no modelo `WarmupCampaignSession`:
  - `autoReadEnabled: Boolean` - Se deve marcar mensagens como lidas automaticamente
  - `autoReadInterval: Int` - Intervalo em segundos para verificar mensagens não lidas
  - `autoReadMinDelay: Int` - Delay mínimo em segundos antes de marcar como lida
  - `autoReadMaxDelay: Int` - Delay máximo em segundos antes de marcar como lida

### 2. Endpoints da API

#### Novos Endpoints (Sessões de Aquecimento)
```
GET    /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-settings
PUT    /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-settings
POST   /warmup/campaigns/:campaignId/sessions/:sessionId/auto-read-toggle
GET    /warmup/campaigns/:campaignId/auto-read-status
```

### 3. Funcionalidade do Cron Job

O processamento de auto-read agora:
- Busca **sessões de aquecimento** ativas com `autoReadEnabled: true`
- Verifica se a sessão WhatsApp está `CONNECTED`
- Verifica se a campanha de aquecimento está ativa
- Usa configurações específicas de cada sessão de aquecimento

## Vantagens da Nova Implementação

### 1. Controle Granular
- Cada sessão de aquecimento pode ter configurações independentes
- Mesmo número WhatsApp pode ter comportamentos diferentes em campanhas diferentes
- Configurações específicas por contexto de uso

### 2. Melhor Organização
- Configurações ficam no contexto correto (campanha de aquecimento)
- Não afeta sessões WhatsApp que não participam de aquecimento
- Facilita auditoria e gerenciamento

### 3. Flexibilidade
- Uma sessão WhatsApp pode participar de múltiplas campanhas com configurações diferentes
- Pausar/retomar auto-read por campanha específica
- Configurar horários e intervalos por tipo de campanha

## Exemplos de Uso

### Obter Configurações de uma Sessão de Aquecimento
```bash
curl -X GET \
  "http://localhost:3000/warmup/campaigns/campaign123/sessions/session456/auto-read-settings" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "campaignId": "campaign123",
  "campaignName": "Aquecimento Premium",
  "sessionId": "session456",
  "sessionName": "WhatsApp Principal",
  "autoReadEnabled": true,
  "autoReadInterval": 60,
  "autoReadMinDelay": 10,
  "autoReadMaxDelay": 30
}
```

### Atualizar Configurações
```bash
curl -X PUT \
  "http://localhost:3000/warmup/campaigns/campaign123/sessions/session456/auto-read-settings" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoReadEnabled": true,
    "autoReadInterval": 45,
    "autoReadMinDelay": 5,
    "autoReadMaxDelay": 25
  }'
```

### Ativar/Desativar Auto-Read
```bash
curl -X POST \
  "http://localhost:3000/warmup/campaigns/campaign123/sessions/session456/auto-read-toggle" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Status da Campanha
```bash
curl -X GET \
  "http://localhost:3000/warmup/campaigns/campaign123/auto-read-status" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta:**
```json
{
  "campaignId": "campaign123",
  "campaignName": "Aquecimento Premium",
  "totalSessions": 5,
  "sessionsAutoReadEnabled": 3,
  "percentageEnabled": 60,
  "sessions": [
    {
      "sessionId": "session456",
      "sessionName": "WhatsApp Principal",
      "autoReadEnabled": true,
      "autoReadInterval": 60,
      "autoReadMinDelay": 10,
      "autoReadMaxDelay": 30
    }
  ]
}
```

## Migração

### Dados Existentes
A migração `20250820172734_move_autoread_to_warmup_session` move as configurações existentes:
- Campos removidos do `WhatsAppSession`
- Campos adicionados ao `WarmupCampaignSession` com valores padrão

### Código
- Novos métodos no `WarmupService` para sessões de aquecimento
- Métodos antigos removidos para evitar confusão
- Endpoints atualizados no `WarmupController`

## Testando

Execute o script de teste:
```bash
./scripts/test-warmup-autoread.sh
```

Este script testa todos os novos endpoints e demonstra o funcionamento completo da funcionalidade.

## Considerações Técnicas

### Performance
- Cron job otimizado para buscar apenas sessões de aquecimento relevantes
- Usa relacionamentos Prisma para queries eficientes
- Processamento em paralelo para múltiplas sessões

### Segurança
- Validação de organizationId em todos os endpoints
- Verificação de existência de campanha e sessão
- Autorização por token JWT

### Monitoramento
- Logs detalhados para debugging
- Métricas de sucesso/erro por sessão
- Rastreamento de performance do cron job

## Próximos Passos

1. **Testes de Integração**: Validar funcionamento com campanhas reais
2. **Interface Web**: Atualizar frontend para usar novos endpoints
3. **Métricas**: Implementar dashboard de monitoramento
4. **Otimizações**: Ajustar configurações baseado no uso real
