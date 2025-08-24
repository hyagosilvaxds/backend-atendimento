# 🔔 API de Notificações WebSocket - Documentação Completa

## Visão Geral

A API de Notificações oferece comunicação em tempo real através de WebSockets para notificar eventos importantes do sistema, como desconexões de sessões WhatsApp, progresso de campanhas de aquecimento, atualizações de saúde e outras atividades críticas.

**Base URL:** `http://localhost:4000/notifications`

**WebSocket Namespace:** `/notifications`

**Autenticação:** Bearer Token JWT

**Permissões Necessárias:** `READ_SESSIONS` (mínimo)

---

## 🔌 Conexão WebSocket

### Estabelecendo Conexão

**URL:** `ws://localhost:4000/notifications`

**Autenticação:**
```javascript
const socket = io('http://localhost:4000/notifications', {
  auth: {
    token: 'seu_jwt_token_aqui',
    organizationId: 'org_123'
  }
});
```

**Parâmetros de Autenticação:**
- `token`: Token JWT válido
- `organizationId`: ID da organização (opcional, extraído do token se não fornecido)

**Resposta de Conexão Bem-Sucedida:**
```javascript
socket.on('connected', (data) => {
  console.log(data);
  // {
  //   message: 'Conectado com sucesso ao sistema de notificações',
  //   userId: 'user_123',
  //   organizationId: 'org_123',
  //   timestamp: '2025-08-18T17:00:00Z'
  // }
});
```

**Erros de Conexão:**
- Conexão rejeitada se token inválido
- Conexão rejeitada se organizationId não fornecido
- Desconexão automática após falha de autenticação

---

## 📡 Eventos de Notificação

### 1. Sessão WhatsApp Desconectada

**Evento:** `session_disconnected`

**Descrição:** Notifica quando uma sessão WhatsApp é desconectada

**Payload:**
```javascript
{
  type: 'session_disconnected',
  timestamp: '2025-08-18T17:05:00Z',
  data: {
    sessionId: 'session_456',
    sessionName: 'WhatsApp Principal',
    phone: '+5511999999999',
    reason: 'Connection lost',
    disconnectedAt: '2025-08-18T17:05:00Z',
    campaignIds: ['campaign_1', 'campaign_2'], // Campanhas afetadas
    reconnectAttempts: 3,
    lastSeen: '2025-08-18T17:04:30Z'
  }
}
```

**Campos do Data:**
- `sessionId`: ID único da sessão
- `sessionName`: Nome amigável da sessão
- `phone`: Número do WhatsApp
- `reason`: Motivo da desconexão
- `disconnectedAt`: Timestamp da desconexão
- `campaignIds`: Array de IDs das campanhas afetadas
- `reconnectAttempts`: Número de tentativas de reconexão
- `lastSeen`: Último momento em que a sessão estava ativa

**Exemplo de Uso:**
```javascript
socket.on('session_disconnected', (notification) => {
  const { data } = notification;
  
  // Exibir alerta para o usuário
  showAlert(`⚠️ Sessão ${data.sessionName} foi desconectada!`);
  
  // Pausar campanhas afetadas
  if (data.campaignIds && data.campaignIds.length > 0) {
    pauseAffectedCampaigns(data.campaignIds);
  }
  
  // Tentar reconectar automaticamente
  if (data.reconnectAttempts < 5) {
    scheduleReconnection(data.sessionId);
  }
});
```

---

### 2. Progresso de Aquecimento

**Evento:** `warmup_progress`

**Descrição:** Notifica sobre o progresso das campanhas de aquecimento

**Payload:**
```javascript
{
  type: 'warmup_progress',
  timestamp: '2025-08-18T17:10:00Z',
  data: {
    campaignId: 'campaign_123',
    campaignName: 'Aquecimento Principal',
    sessionId: 'session_456',
    sessionName: 'WhatsApp Principal',
    progress: {
      dailyMessagesSent: 35,
      dailyGoal: 50,
      completionPercentage: 70,
      healthScore: 85.5,
      remainingMessages: 15,
      estimatedCompletion: '2025-08-18T19:30:00Z'
    },
    metrics: {
      successRate: 0.97,
      averageResponseTime: 3600,
      lastMessageSent: '2025-08-18T17:08:00Z'
    }
  }
}
```

**Campos do Progress:**
- `dailyMessagesSent`: Mensagens enviadas hoje
- `dailyGoal`: Meta diária de mensagens
- `completionPercentage`: Percentual de conclusão do dia
- `healthScore`: Pontuação de saúde atual
- `remainingMessages`: Mensagens restantes para completar a meta
- `estimatedCompletion`: Estimativa de conclusão da meta diária

**Exemplo de Uso:**
```javascript
socket.on('warmup_progress', (notification) => {
  const { data } = notification;
  
  // Atualizar barra de progresso na UI
  updateProgressBar(data.campaignId, data.progress.completionPercentage);
  
  // Atualizar métricas do dashboard
  updateCampaignMetrics(data.campaignId, {
    sent: data.progress.dailyMessagesSent,
    goal: data.progress.dailyGoal,
    health: data.progress.healthScore
  });
  
  // Notificar se meta foi atingida
  if (data.progress.completionPercentage >= 100) {
    showSuccess(`🎉 Meta diária atingida para ${data.campaignName}!`);
  }
});
```

---

### 3. Execução de Aquecimento

**Evento:** `warmup_execution`

**Descrição:** Notifica sobre execuções individuais de mensagens de aquecimento

**Payload:**
```javascript
{
  type: 'warmup_execution',
  timestamp: '2025-08-18T17:15:00Z',
  data: {
    executionId: 'exec_789',
    campaignId: 'campaign_123',
    campaignName: 'Aquecimento Principal',
    contactId: 'contact_456',
    contactName: 'João Silva',
    contactPhone: '+5511888888888',
    templateId: 'template_123',
    messageContent: 'Oi João! Como você está? 😊',
    mediaType: 'text',
    mediaUrl: null,
    status: 'sent', // 'scheduled', 'sent', 'delivered', 'failed'
    scheduledAt: '2025-08-18T17:15:00Z',
    sentAt: '2025-08-18T17:15:05Z',
    deliveredAt: null,
    error: null,
    nextExecution: '2025-08-18T17:45:00Z'
  }
}
```

**Status Possíveis:**
- `scheduled`: Execução agendada
- `sent`: Mensagem enviada
- `delivered`: Mensagem entregue
- `failed`: Falha no envio

**Exemplo de Uso:**
```javascript
socket.on('warmup_execution', (notification) => {
  const { data } = notification;
  
  // Adicionar à lista de atividades recentes
  addToActivityLog({
    type: 'warmup_message',
    campaign: data.campaignName,
    contact: data.contactName,
    status: data.status,
    timestamp: data.timestamp
  });
  
  // Atualizar contador de mensagens enviadas
  if (data.status === 'sent') {
    incrementMessageCounter(data.campaignId);
  }
  
  // Tratar erros
  if (data.status === 'failed') {
    logError(`Falha ao enviar mensagem para ${data.contactName}: ${data.error}`);
  }
});
```

---

### 4. Atualização de Saúde

**Evento:** `health_update`

**Descrição:** Notifica sobre mudanças na saúde dos números WhatsApp

**Payload:**
```javascript
{
  type: 'health_update',
  timestamp: '2025-08-18T17:20:00Z',
  data: {
    sessionId: 'session_456',
    sessionName: 'WhatsApp Principal',
    phone: '+5511999999999',
    previousHealth: 82.0,
    currentHealth: 85.5,
    healthChange: 3.5,
    healthTrend: 'increasing', // 'increasing', 'decreasing', 'stable'
    metrics: {
      responseRate: 85,
      messageDeliveryRate: 96,
      onlineTime: 90,
      errorRate: 4
    },
    factors: [
      'Melhora na taxa de resposta',
      'Redução de erros de envio'
    ],
    recommendations: [
      'Continue com o padrão atual de mensagens',
      'Considere aumentar ligeiramente a frequência'
    ],
    riskLevel: 'low' // 'low', 'medium', 'high', 'critical'
  }
}
```

**Níveis de Risco:**
- `low` (0-25): Saúde boa, baixo risco
- `medium` (26-50): Atenção necessária
- `high` (51-75): Risco elevado, ação recomendada
- `critical` (76-100): Risco crítico, ação imediata

**Exemplo de Uso:**
```javascript
socket.on('health_update', (notification) => {
  const { data } = notification;
  
  // Atualizar indicador de saúde na UI
  updateHealthIndicator(data.sessionId, data.currentHealth, data.riskLevel);
  
  // Mostrar notificação baseada na mudança
  if (data.healthChange > 0) {
    showInfo(`📈 Saúde melhorou: ${data.sessionName} (+${data.healthChange.toFixed(1)})`);
  } else if (data.healthChange < -5) {
    showWarning(`📉 Saúde em declínio: ${data.sessionName} (${data.healthChange.toFixed(1)})`);
  }
  
  // Tomar ação baseada no nível de risco
  if (data.riskLevel === 'critical') {
    pauseAllCampaignsForSession(data.sessionId);
    showAlert(`🚨 Saúde crítica detectada para ${data.sessionName}! Campanhas pausadas.`);
  }
});
```

---

### 5. Múltiplas Desconexões

**Evento:** `multiple_disconnections`

**Descrição:** Notifica quando múltiplas sessões desconectam simultaneamente

**Payload:**
```javascript
{
  type: 'multiple_disconnections',
  timestamp: '2025-08-18T17:25:00Z',
  data: {
    count: 5,
    timeWindow: 60, // segundos
    sessions: [
      {
        sessionId: 'session_1',
        sessionName: 'WhatsApp 1',
        phone: '+5511111111111',
        disconnectedAt: '2025-08-18T17:25:10Z'
      },
      {
        sessionId: 'session_2',
        sessionName: 'WhatsApp 2', 
        phone: '+5511222222222',
        disconnectedAt: '2025-08-18T17:25:15Z'
      }
      // ... mais sessões
    ],
    possibleCauses: [
      'Instabilidade na conexão de internet',
      'Problema no servidor WhatsApp',
      'Atualização forçada do WhatsApp Web'
    ],
    affectedCampaigns: ['campaign_1', 'campaign_2', 'campaign_3'],
    recommendedActions: [
      'Verificar conexão de internet',
      'Aguardar 5-10 minutos antes de reconectar',
      'Verificar status do WhatsApp Web'
    ]
  }
}
```

**Exemplo de Uso:**
```javascript
socket.on('multiple_disconnections', (notification) => {
  const { data } = notification;
  
  // Exibir alerta crítico
  showAlert(`🚨 ${data.count} sessões desconectaram simultaneamente!`);
  
  // Pausar todas as campanhas afetadas
  pauseCampaigns(data.affectedCampaigns);
  
  // Mostrar possíveis causas
  showTroubleshootingModal({
    title: 'Múltiplas Desconexões Detectadas',
    causes: data.possibleCauses,
    actions: data.recommendedActions
  });
  
  // Agendar verificação automática
  scheduleHealthCheck(300000); // 5 minutos
});
```

---

### 6. Limite Diário Atingido

**Evento:** `daily_limit_reached`

**Descrição:** Notifica quando uma campanha atinge sua meta diária

**Payload:**
```javascript
{
  type: 'daily_limit_reached',
  timestamp: '2025-08-18T17:30:00Z',
  data: {
    campaignId: 'campaign_123',
    campaignName: 'Aquecimento Principal',
    sessionId: 'session_456',
    sessionName: 'WhatsApp Principal',
    dailyGoal: 50,
    messagesSent: 50,
    completionTime: '2025-08-18T17:30:00Z',
    efficiency: 0.95, // Eficiência da campanha (0-1)
    nextExecutionDate: '2025-08-19T08:00:00Z',
    performance: {
      successRate: 0.96,
      averageResponseTime: 3200,
      healthScoreChange: 2.5
    }
  }
}
```

**Exemplo de Uso:**
```javascript
socket.on('daily_limit_reached', (notification) => {
  const { data } = notification;
  
  // Celebrar conquista
  showSuccess(`🎯 Meta diária atingida: ${data.campaignName}!`);
  
  // Atualizar status da campanha
  updateCampaignStatus(data.campaignId, 'completed_daily');
  
  // Mostrar estatísticas
  showDailyReport({
    campaign: data.campaignName,
    messagesSent: data.messagesSent,
    successRate: data.performance.successRate,
    efficiency: data.efficiency,
    nextExecution: data.nextExecutionDate
  });
});
```

---

## 🔧 Endpoints HTTP da API

### 1. Estatísticas de Conexão

**Endpoint:** `GET /notifications/stats`

**Descrição:** Obtém estatísticas das conexões WebSocket ativas

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Resposta (200):**
```json
{
  "totalConnections": 15,
  "connectionsByOrganization": {
    "org_123": 8,
    "org_456": 7
  },
  "activeRooms": [
    "org_123",
    "org_456"
  ],
  "serverUptime": 86400,
  "lastActivity": "2025-08-18T17:35:00Z"
}
```

---

### 2. Teste de Conexão

**Endpoint:** `POST /notifications/test`

**Descrição:** Envia uma notificação de teste via WebSocket

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Resposta (200):**
```json
{
  "message": "Test notification sent successfully",
  "timestamp": "2025-08-18T17:40:00Z",
  "targetOrganization": "org_123"
}
```

---

### 3. Notificação Personalizada

**Endpoint:** `POST /notifications/custom`

**Descrição:** Envia uma notificação personalizada

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Payload:**
```json
{
  "event": "custom_event",
  "data": {
    "title": "Notificação Personalizada",
    "message": "Esta é uma mensagem personalizada",
    "priority": "high",
    "actionUrl": "/dashboard/campaigns"
  }
}
```

**Resposta (200):**
```json
{
  "message": "Custom notification sent successfully",
  "event": "custom_event",
  "timestamp": "2025-08-18T17:45:00Z"
}
```

---

## 🧪 Endpoints de Teste

### 4. Teste de Sessão Desconectada

**Endpoint:** `POST /notifications/test-session-disconnected`

**Descrição:** Simula uma notificação de sessão desconectada

**Resposta (200):**
```json
{
  "success": true,
  "message": "Notificação de sessão desconectada enviada",
  "data": {
    "sessionId": "test_session_123",
    "sessionName": "Teste WhatsApp",
    "phone": "+5511999999999",
    "reason": "Teste de desconexão"
  }
}
```

### 5. Teste de Progresso de Aquecimento

**Endpoint:** `POST /notifications/test-warmup-progress`

**Descrição:** Simula uma notificação de progresso de aquecimento

**Resposta (200):**
```json
{
  "success": true,
  "message": "Notificação de progresso de aquecimento enviada",
  "data": {
    "campaignId": "campaign_test_123",
    "progress": {
      "dailyMessagesSent": 25,
      "dailyGoal": 50,
      "healthScore": 85.5
    }
  }
}
```

### 6. Teste de Execução de Aquecimento

**Endpoint:** `POST /notifications/test-warmup-execution`

**Descrição:** Simula uma notificação de execução de aquecimento

### 7. Teste de Atualização de Saúde

**Endpoint:** `POST /notifications/test-health-update`

**Descrição:** Simula uma notificação de atualização de saúde

### 8. Teste de Múltiplas Desconexões

**Endpoint:** `POST /notifications/test-multiple-disconnections`

**Descrição:** Simula uma notificação de múltiplas desconexões

### 9. Teste de Limite Diário

**Endpoint:** `POST /notifications/test-daily-limit`

**Descrição:** Simula uma notificação de limite diário atingido

---

## 🎨 Exemplo de Cliente JavaScript Completo

### Configuração Básica

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:4000/notifications', {
  auth: {
    token: localStorage.getItem('jwt_token'),
    organizationId: localStorage.getItem('organization_id')
  }
});

// Gerenciar estados de conexão
socket.on('connect', () => {
  console.log('✅ Conectado ao sistema de notificações');
  updateConnectionStatus(true);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do sistema de notificações');
  updateConnectionStatus(false);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error);
  showError('Erro ao conectar com notificações');
});
```

### Sistema de Notificações Unificado

```javascript
class NotificationManager {
  constructor(socket) {
    this.socket = socket;
    this.notifications = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Sessão desconectada
    this.socket.on('session_disconnected', (notification) => {
      this.handleSessionDisconnected(notification);
    });

    // Progresso de aquecimento
    this.socket.on('warmup_progress', (notification) => {
      this.handleWarmupProgress(notification);
    });

    // Execução de aquecimento
    this.socket.on('warmup_execution', (notification) => {
      this.handleWarmupExecution(notification);
    });

    // Atualização de saúde
    this.socket.on('health_update', (notification) => {
      this.handleHealthUpdate(notification);
    });

    // Múltiplas desconexões
    this.socket.on('multiple_disconnections', (notification) => {
      this.handleMultipleDisconnections(notification);
    });

    // Limite diário atingido
    this.socket.on('daily_limit_reached', (notification) => {
      this.handleDailyLimitReached(notification);
    });
  }

  handleSessionDisconnected(notification) {
    const { data } = notification;
    
    // Adicionar à lista de notificações
    this.addNotification({
      type: 'warning',
      title: '⚠️ Sessão Desconectada',
      message: `${data.sessionName} foi desconectada`,
      timestamp: notification.timestamp,
      actions: [
        {
          label: 'Reconectar',
          action: () => this.reconnectSession(data.sessionId)
        },
        {
          label: 'Ver Detalhes',
          action: () => this.showSessionDetails(data.sessionId)
        }
      ]
    });

    // Atualizar UI
    this.updateSessionStatus(data.sessionId, 'disconnected');
    
    // Pausar campanhas se necessário
    if (data.campaignIds?.length > 0) {
      this.pauseCampaigns(data.campaignIds);
    }
  }

  handleWarmupProgress(notification) {
    const { data } = notification;
    
    // Atualizar progresso na UI
    this.updateCampaignProgress(data.campaignId, data.progress);
    
    // Notificar marcos importantes
    if (data.progress.completionPercentage === 50) {
      this.addNotification({
        type: 'info',
        title: '📊 Meio do Caminho',
        message: `${data.campaignName} atingiu 50% da meta diária`,
        timestamp: notification.timestamp
      });
    }
  }

  handleHealthUpdate(notification) {
    const { data } = notification;
    
    // Determinar tipo de notificação baseado no risco
    const notificationType = this.getNotificationTypeForRisk(data.riskLevel);
    
    this.addNotification({
      type: notificationType,
      title: '🏥 Atualização de Saúde',
      message: `${data.sessionName}: ${data.currentHealth.toFixed(1)}% (${data.healthChange > 0 ? '+' : ''}${data.healthChange.toFixed(1)})`,
      timestamp: notification.timestamp,
      details: {
        previousHealth: data.previousHealth,
        currentHealth: data.currentHealth,
        trend: data.healthTrend,
        recommendations: data.recommendations
      }
    });

    // Ação automática para risco crítico
    if (data.riskLevel === 'critical') {
      this.handleCriticalHealth(data);
    }
  }

  addNotification(notification) {
    // Adicionar à lista
    this.notifications.unshift({
      id: Date.now(),
      ...notification,
      read: false,
      createdAt: new Date()
    });

    // Limitar a 100 notificações
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Atualizar UI
    this.renderNotifications();
    this.updateNotificationBadge();

    // Mostrar toast se a página estiver ativa
    if (document.hasFocus()) {
      this.showToast(notification);
    } else {
      // Mostrar notificação do browser se a página não estiver ativa
      this.showBrowserNotification(notification);
    }
  }

  showToast(notification) {
    // Implementar toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${notification.type}`;
    toast.innerHTML = `
      <div class="toast-header">
        <strong>${notification.title}</strong>
        <small>${new Date().toLocaleTimeString()}</small>
      </div>
      <div class="toast-body">
        ${notification.message}
      </div>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/badge.png'
      });
    }
  }
}

// Inicializar o gerenciador
const notificationManager = new NotificationManager(socket);
```

### Interface de Usuário

```html
<!-- Container de Notificações -->
<div id="notifications-panel" class="notifications-panel">
  <div class="notifications-header">
    <h4>🔔 Notificações</h4>
    <span id="notification-badge" class="badge">0</span>
  </div>
  
  <div id="notifications-list" class="notifications-list">
    <!-- Notificações serão inseridas aqui -->
  </div>
  
  <div class="notifications-footer">
    <button onclick="markAllAsRead()">Marcar todas como lidas</button>
    <button onclick="clearAllNotifications()">Limpar todas</button>
  </div>
</div>

<!-- Container de Toasts -->
<div id="toast-container" class="toast-container">
  <!-- Toasts serão inseridos aqui -->
</div>
```

### CSS para Styling

```css
.notifications-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.toast {
  min-width: 300px;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toast-success { background-color: #d4edda; color: #155724; }
.toast-warning { background-color: #fff3cd; color: #856404; }
.toast-error { background-color: #f8d7da; color: #721c24; }
.toast-info { background-color: #d1ecf1; color: #0c5460; }
```

---

## 🛡️ Tratamento de Erros

### Reconexão Automática

```javascript
socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
  
  if (reason === 'io server disconnect') {
    // Servidor forçou desconexão, reconectar manualmente
    socket.connect();
  }
  // Para outros motivos, Socket.IO reconecta automaticamente
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconectado após ${attemptNumber} tentativas`);
  showSuccess('✅ Reconectado ao sistema de notificações');
});

socket.on('reconnect_error', (error) => {
  console.error('Erro na reconexão:', error);
  showError('❌ Falha ao reconectar. Verifique sua conexão.');
});
```

### Validação de Mensagens

```javascript
function validateNotification(notification) {
  if (!notification || typeof notification !== 'object') {
    console.warn('Notificação inválida recebida:', notification);
    return false;
  }

  if (!notification.type || !notification.timestamp || !notification.data) {
    console.warn('Notificação com campos obrigatórios faltando:', notification);
    return false;
  }

  return true;
}

// Usar em todos os event listeners
socket.on('session_disconnected', (notification) => {
  if (!validateNotification(notification)) return;
  
  // Processar notificação...
});
```

---

## ⚡ Performance e Otimizações

### Throttling de Notificações

```javascript
class NotificationThrottler {
  constructor(maxPerSecond = 5) {
    this.maxPerSecond = maxPerSecond;
    this.queue = [];
    this.processing = false;
  }

  add(notification) {
    this.queue.push(notification);
    this.process();
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxPerSecond);
      
      batch.forEach(notification => {
        this.processNotification(notification);
      });
      
      if (this.queue.length > 0) {
        await this.sleep(1000); // Aguardar 1 segundo
      }
    }
    
    this.processing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  processNotification(notification) {
    // Processar notificação individual
    notificationManager.addNotification(notification);
  }
}

const throttler = new NotificationThrottler(3); // 3 por segundo

// Usar o throttler
socket.on('warmup_execution', (notification) => {
  throttler.add(notification);
});
```

---

## 📊 Métricas e Monitoramento

### Coleta de Métricas

```javascript
class NotificationMetrics {
  constructor() {
    this.metrics = {
      totalReceived: 0,
      byType: {},
      errors: 0,
      connectionTime: Date.now(),
      lastActivity: Date.now()
    };
  }

  recordNotification(type) {
    this.metrics.totalReceived++;
    this.metrics.byType[type] = (this.metrics.byType[type] || 0) + 1;
    this.metrics.lastActivity = Date.now();
  }

  recordError() {
    this.metrics.errors++;
  }

  getStats() {
    const uptime = Date.now() - this.metrics.connectionTime;
    return {
      ...this.metrics,
      uptimeMs: uptime,
      avgPerMinute: (this.metrics.totalReceived / (uptime / 60000)).toFixed(2)
    };
  }
}

const metrics = new NotificationMetrics();

// Registrar métricas em todos os eventos
socket.on('session_disconnected', (notification) => {
  metrics.recordNotification('session_disconnected');
  // ... processar notificação
});
```

---

## 🔒 Segurança

### Validação de Origem

```javascript
// Verificar se a notificação vem do servidor correto
socket.on('connect', () => {
  const serverUrl = socket.io.uri;
  const expectedUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
  
  if (!serverUrl.startsWith(expectedUrl)) {
    console.error('⚠️ Conexão com servidor não autorizado:', serverUrl);
    socket.disconnect();
    return;
  }
});
```

### Rate Limiting no Cliente

```javascript
class ClientRateLimit {
  constructor(maxPerMinute = 60) {
    this.maxPerMinute = maxPerMinute;
    this.requests = [];
  }

  canProcess() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remover requests antigos
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    
    if (this.requests.length >= this.maxPerMinute) {
      console.warn('⚠️ Rate limit atingido para notificações');
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

const rateLimiter = new ClientRateLimit(30); // 30 por minuto

// Aplicar rate limiting
socket.on('warmup_execution', (notification) => {
  if (!rateLimiter.canProcess()) return;
  
  // Processar notificação...
});
```

---

*Documentação gerada em 18 de agosto de 2025*
