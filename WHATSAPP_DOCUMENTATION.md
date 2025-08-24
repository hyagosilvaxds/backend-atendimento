# Sistema WhatsApp - Documentação da API

## Visão Geral

O sistema WhatsApp permite criar e gerenciar múltiplas sessões WhatsApp por organização usando a biblioteca Baileys. Cada organização pode ter sessões ilimitadas.

## Funcionalidades

- ✅ Criação de sessões WhatsApp multi-sessão por organização
- ✅ Geração automática de QR codes para conexão
- ✅ Controle de status das sessões (CONNECTING, CONNECTED, DISCONNECTED, FAILED)
- ✅ Tipos de sessão (MAIN, SUPPORT, SALES, MARKETING)
- ✅ Envio de mensagens por sessão
- ✅ Sistema de permissões granular para WhatsApp
- ✅ Webhooks para recebimento de eventos

## Endpoints da API

### 1. Criar Sessão WhatsApp

**POST** `/whatsapp/sessions`

**Permissão Necessária:** `CREATE WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Nome da Sessão",
  "type": "MAIN",  // MAIN, SUPPORT, SALES, MARKETING
  "webhookUrl": "https://seu-webhook.com/whatsapp" // Opcional
}
```

**Resposta (201):**
```json
{
  "id": "cmeha01400002vb4qwhp43jow",
  "name": "Atendimento Principal",
  "sessionId": "session_org123_1234567890",
  "phone": null,
  "qrCode": null,
  "status": "CONNECTING",
  "type": "MAIN",
  "isActive": true,
  "lastConnectedAt": null,
  "lastDisconnectedAt": null,
  "createdAt": "2025-08-18T15:34:45.409Z"
}
```

**Erros Possíveis:**
- `400` - Dados inválidos
- `403` - Sem permissão

---

### 2. Listar Sessões WhatsApp

**GET** `/whatsapp/sessions`

**Permissão Necessária:** `READ WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
?status=CONNECTED    // Filtrar por status (opcional)
?type=MAIN          // Filtrar por tipo (opcional)
?isActive=true      // Filtrar por status ativo (opcional)
```

**Resposta (200):**
```json
[
  {
    "id": "cmeha01400002vb4qwhp43jow",
    "name": "Atendimento Principal",
    "sessionId": "session_org123_1234567890",
    "phone": "+5511999999999",
    "qrCode": null,
    "status": "CONNECTED",
    "type": "MAIN",
    "isActive": true,
    "lastConnectedAt": "2025-08-18T15:35:00.000Z",
    "lastDisconnectedAt": null,
    "createdAt": "2025-08-18T15:34:45.409Z"
  }
]
```

---

### 3. Obter Sessão Específica

**GET** `/whatsapp/sessions/:sessionId`

**Permissão Necessária:** `READ WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "id": "cmeha01400002vb4qwhp43jow",
  "name": "Atendimento Principal",
  "sessionId": "session_org123_1234567890",
  "phone": "+5511999999999",
  "qrCode": null,
  "status": "CONNECTED",
  "type": "MAIN",
  "isActive": true,
  "lastConnectedAt": "2025-08-18T15:35:00.000Z",
  "lastDisconnectedAt": null,
  "createdAt": "2025-08-18T15:34:45.409Z"
}
```

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão

---

### 4. Obter QR Code

**GET** `/whatsapp/sessions/:sessionId/qr`

**Permissão Necessária:** `READ WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Resposta quando conectado:**
```json
{
  "qrCode": null,
  "message": "Sessão já está conectada"
}
```

---

### 5. Verificar Status da Sessão (Polling)

**GET** `/whatsapp/sessions/:sessionId/status`

**Permissão Necessária:** `READ WHATSAPP_SESSIONS`

**Descrição:** Endpoint para polling do status da sessão. Use este endpoint para verificar quando o QR code está pronto ou quando a sessão foi conectada.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200) - QR Code Pronto:**
```json
{
  "status": "QR_CODE",
  "qrCodeReady": true,
  "connected": false,
  "phone": null,
  "lastUpdate": "2025-08-18T15:35:00.000Z",
  "timestamp": 1755534900000
}
```

**Resposta (200) - Sessão Conectada:**
```json
{
  "status": "CONNECTED",
  "qrCodeReady": false,
  "connected": true,
  "phone": "+5511999999999",
  "lastUpdate": "2025-08-18T15:36:00.000Z",
  "timestamp": 1755534960000
}
```

**Resposta (200) - Conectando:**
```json
{
  "status": "CONNECTING",
  "qrCodeReady": false,
  "connected": false,
  "phone": null,
  "lastUpdate": "2025-08-18T15:34:45.000Z",
  "timestamp": 1755534885000
}
```

**Campos da Resposta:**
- `status`: Status atual da sessão (CONNECTING, QR_CODE, CONNECTED, DISCONNECTED, FAILED)
- `qrCodeReady`: `true` quando o QR code está pronto para ser escaneado
- `connected`: `true` quando a sessão está conectada e operacional
- `phone`: Número do telefone conectado (apenas quando conectado)
- `lastUpdate`: Data da última atualização do status
- `timestamp`: Timestamp atual do servidor para sincronização

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão

---

### 6. Deletar Sessão

**DELETE** `/whatsapp/sessions/:sessionId`

**Permissão Necessária:** `DELETE WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "message": "Sessão deletada com sucesso"
}
```

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão

---

### 7. Desconectar Sessão

**POST** `/whatsapp/sessions/:sessionId/disconnect`

**Permissão Necessária:** `UPDATE WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "message": "Sessão desconectada com sucesso",
  "status": "DISCONNECTED"
}
```

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão
- `400` - Falha ao desconectar

---

### 8. Reconectar Sessão

**POST** `/whatsapp/sessions/:sessionId/connect`

**Permissão Necessária:** `UPDATE WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "message": "Reconexão iniciada com sucesso",
  "status": "CONNECTING"
}
```

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão
- `400` - Falha ao reconectar

---

### 9. Atualizar QR Code

**POST** `/whatsapp/sessions/:sessionId/qr/refresh`

**Permissão Necessária:** `UPDATE WHATSAPP_SESSIONS`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200) - QR Code atualizado:**
```json
{
  "message": "QR code atualizado com sucesso",
  "status": "CONNECTING"
}
```

**Resposta (200) - Sessão já conectada:**
```json
{
  "message": "Sessão já está conectada, não é necessário atualizar QR code",
  "status": "CONNECTED"
}
```

**Erros Possíveis:**
- `404` - Sessão não encontrada
- `403` - Sem permissão
- `400` - Falha ao atualizar QR code

---

### 10. Enviar Mensagem

**POST** `/whatsapp/sessions/:sessionId/send`

**Permissão Necessária:** `CREATE MESSAGES`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Payload (Mensagem de Texto):**
```json
{
  "to": "5511999999999",
  "type": "text",
  "message": "Olá! Como posso ajudá-lo?"
}
```

**Payload (Mensagem com Mídia):**
```json
{
  "to": "5511999999999",
  "type": "image",
  "message": "Veja esta imagem",
  "mediaUrl": "https://exemplo.com/imagem.jpg"
}
```

**Resposta (200):**
```json
{
  "messageId": "BAE5F5F5F5F5F5F5F5F5F5F5F5F5F5F5",
  "status": "sent",
  "timestamp": "2025-08-18T15:40:00.000Z"
}
```

**Erros Possíveis:**
- `400` - Dados inválidos
- `403` - Sem permissão
- `404` - Sessão não encontrada
- `409` - Sessão não está conectada

---

## Notificações de Status em Tempo Real

### Polling de Status

Para acompanhar o status da sessão em tempo real, utilize o endpoint de polling:

**Fluxo Recomendado:**

1. **Criar Sessão**: `POST /whatsapp/sessions`
2. **Iniciar Polling**: `GET /whatsapp/sessions/:sessionId/status` (a cada 2-3 segundos)
3. **Detectar QR Code**: Quando `qrCodeReady = true`, buscar QR code com `GET /whatsapp/sessions/:sessionId/qr`
4. **Exibir QR Code**: Mostrar para o usuário escanear
5. **Detectar Conexão**: Quando `connected = true`, parar polling e fechar modal
6. **Tratamento de Erro**: Se `status = FAILED`, mostrar erro e permitir nova tentativa

**Exemplo JavaScript (Frontend):**

```javascript
async function monitorSessionStatus(sessionId, token) {
  const pollInterval = 3000; // 3 segundos
  let polling = true;
  
  const poll = async () => {
    try {
      const response = await fetch(`/whatsapp/sessions/${sessionId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const status = await response.json();
      
      // QR Code está pronto
      if (status.qrCodeReady && !status.connected) {
        console.log('QR Code está pronto para escaneamento!');
        await loadQRCode(sessionId, token);
        showQRCodeModal();
      }
      
      // Sessão conectada
      if (status.connected) {
        console.log('Sessão conectada com sucesso!', status.phone);
        hideQRCodeModal();
        showSuccessMessage(`WhatsApp conectado: ${status.phone}`);
        polling = false;
        return;
      }
      
      // Falha na conexão
      if (status.status === 'FAILED') {
        console.log('Falha na conexão');
        hideQRCodeModal();
        showErrorMessage('Falha ao conectar. Tente novamente.');
        polling = false;
        return;
      }
      
      // Continue polling se ainda conectando
      if (polling && status.status === 'CONNECTING') {
        setTimeout(poll, pollInterval);
      }
      
    } catch (error) {
      console.error('Erro no polling:', error);
      polling = false;
    }
  };
  
  // Iniciar polling
  poll();
  
  // Função para parar polling externamente
  return () => { polling = false; };
}

async function loadQRCode(sessionId, token) {
  const response = await fetch(`/whatsapp/sessions/${sessionId}/qr`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { qrCode } = await response.json();
  
  if (qrCode) {
    document.getElementById('qr-code-image').src = qrCode;
  }
}
```

**Exemplo React Hook:**

```jsx
import { useState, useEffect, useCallback } from 'react';

function useWhatsAppSession(sessionId, token) {
  const [status, setStatus] = useState(null);
  const [qrCode, setQRCode] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/whatsapp/sessions/${sessionId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const statusData = await response.json();
      setStatus(statusData);
      
      // Buscar QR code se pronto
      if (statusData.qrCodeReady && !qrCode) {
        const qrResponse = await fetch(`/whatsapp/sessions/${sessionId}/qr`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const { qrCode: qrCodeData } = await qrResponse.json();
        setQRCode(qrCodeData);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId, token, qrCode]);
  
  useEffect(() => {
    if (!sessionId || !token) return;
    
    // Polling a cada 3 segundos
    const interval = setInterval(fetchStatus, 3000);
    
    // Buscar status inicial
    fetchStatus();
    
    // Cleanup
    return () => clearInterval(interval);
  }, [fetchStatus, sessionId, token]);
  
  return { status, qrCode, error };
}
```

### Estados da Interface

**Estado: CONNECTING**
- Mostrar: "Inicializando conexão WhatsApp..."
- Loading spinner

**Estado: QR_CODE (qrCodeReady = true)**
- Mostrar: QR Code para escaneamento
- Instruções: "Escaneie o QR code com seu WhatsApp"
- Botão: "Atualizar QR Code" (se expirar)

**Estado: CONNECTED**
- Mostrar: "✅ WhatsApp conectado com sucesso!"
- Telefone conectado
- Fechar modal automaticamente

**Estado: FAILED**
- Mostrar: "❌ Falha ao conectar"
- Botão: "Tentar novamente"

---

## Sistema de Recuperação de Estado

### Problema Resolvido: Sessões Inconsistentes

**Problema**: Quando o servidor é reiniciado, as sessões WhatsApp ficam desconectadas na memória, mas permanecem marcadas como "CONNECTED" no banco de dados.

**Solução Implementada**:

1. **Verificação na Inicialização**: Ao iniciar o servidor, o sistema automaticamente verifica e corrige sessões inconsistentes.

2. **Detecção em Tempo Real**: O endpoint de status verifica a consistência entre banco e memória a cada consulta.

3. **Correção Automática**: Sessões inconsistentes são automaticamente marcadas como "DISCONNECTED" e seus dados são limpos.

### Como Funciona

**Na Inicialização do Servidor**:
```
[WhatsAppService] Inicializando módulo WhatsApp...
[WhatsAppService] Verificando sessões inconsistentes...
[WhatsAppService] X sessões foram marcadas como desconectadas após reinício do servidor.
```

**Durante Consultas de Status**:
- Sistema verifica se existe socket na memória para sessões marcadas como conectadas
- Se inconsistência detectada, corrige automaticamente o status
- Retorna status real da sessão

**Limpeza Automática**:
- Remove diretórios de autenticação órfãos
- Limpa QR codes obsoletos
- Atualiza timestamps de desconexão

### Benefícios

✅ **Estado Consistente**: Banco e memória sempre em sincronia  
✅ **Recuperação Automática**: Sem necessidade de intervenção manual  
✅ **Detecção em Tempo Real**: Problemas detectados imediatamente  
✅ **Limpeza Inteligente**: Remove dados obsoletos automaticamente  

---

## Status das Sessões

- **DISCONNECTED**: Sessão desconectada
- **CONNECTING**: Tentando conectar (gerando QR code)
- **QR_CODE**: QR code disponível para escaneamento
- **CONNECTED**: Conectado e pronto para uso
- **FAILED**: Falha na conexão

## Tipos de Sessão

- **MAIN**: Atendimento principal
- **SUPPORT**: Suporte técnico
- **SALES**: Vendas
- **MARKETING**: Marketing

## Sistema de Permissões

### Permissões Disponíveis

| Ação | Recurso | Descrição |
|------|---------|-----------|
| `CREATE` | `WHATSAPP_SESSIONS` | Criar sessões WhatsApp |
| `READ` | `WHATSAPP_SESSIONS` | Listar/visualizar sessões |
| `UPDATE` | `WHATSAPP_SESSIONS` | Atualizar configurações da sessão |
| `DELETE` | `WHATSAPP_SESSIONS` | Deletar sessões |
| `MANAGE` | `WHATSAPP_SESSIONS` | Gerenciar todas as operações |

### Permissões por Role

| Role | Permissões |
|------|-----------|
| `SUPER_ADMIN` | Todas as permissões |
| `ORG_ADMIN` | Todas as permissões da organização |
| `ORG_USER` | `CREATE`, `READ`, `UPDATE` WHATSAPP_SESSIONS |
| `ORG_VIEWER` | Apenas `READ` WHATSAPP_SESSIONS |

## Webhooks

O sistema suporta webhooks para receber eventos do WhatsApp:

### Eventos Enviados

**Mensagem Recebida:**
```json
{
  "event": "message_received",
  "sessionId": "session_org123_1234567890",
  "data": {
    "messageId": "BAE5F5F5F5F5F5F5F5F5F5F5F5F5F5F5",
    "from": "5511999999999",
    "chatId": "5511999999999@c.us",
    "messageType": "text",
    "content": "Olá!",
    "timestamp": "2025-08-18T15:40:00.000Z"
  }
}
```

**Status da Sessão Alterado:**
```json
{
  "event": "session_status_changed",
  "sessionId": "session_org123_1234567890",
  "data": {
    "oldStatus": "CONNECTING",
    "newStatus": "CONNECTED",
    "phone": "+5511999999999",
    "timestamp": "2025-08-18T15:35:00.000Z"
  }
}
```

## Limitações

- **Timeout de QR code: 45 segundos**
- **Reconexão automática em caso de queda**
- **Armazenamento de dados de autenticação em memória**

## Exemplo de Uso Completo

### 1. Login
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empresa.com", "password": "admin123"}' | jq -r '.access_token')
```

### 2. Criar Sessão
```bash
curl -X POST http://localhost:4000/whatsapp/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Atendimento Principal", "type": "MAIN"}' | jq
```

### 3. Obter QR Code
```bash
curl -X GET "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/qr" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 4. Listar Sessões
```bash
curl -X GET http://localhost:4000/whatsapp/sessions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5. Verificar Status da Sessão (Polling)
```bash
curl -X GET "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/status" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 6. Enviar Mensagem
```bash
curl -X POST "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"to": "5511999999999", "type": "text", "message": "Olá! Como posso ajudá-lo?"}' | jq
```

### 7. Desconectar Sessão
```bash
curl -X POST "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/disconnect" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 8. Reconectar Sessão
```bash
curl -X POST "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/connect" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 9. Atualizar QR Code
```bash
curl -X POST "http://localhost:4000/whatsapp/sessions/session_org123_1234567890/qr/refresh" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Configuração de Ambiente

Certifique-se de ter as seguintes variáveis de ambiente configuradas:

```env
DATABASE_URL="postgresql://user:password@localhost:5435/atendimento"
JWT_SECRET="seu-jwt-secret-super-seguro"
PORT=4000
```

## Instalação das Dependências

As seguintes dependências já foram instaladas:

```json
{
  "@whiskeysockets/baileys": "^6.7.18",
  "qrcode": "^1.5.4",
  "qrcode-terminal": "^0.12.0",
  "sharp": "^0.32.6"
}
```

## Próximos Passos

1. **Implementar persistência de dados de autenticação** - Atualmente os dados ficam em memória
2. **Adicionar suporte a mensagens de mídia** - Imagens, vídeos, documentos
3. **Implementar sistema de filas** - Para gerenciar atendimentos
4. **Adicionar chatbot básico** - Respostas automáticas
5. **Dashboard em tempo real** - Interface web para monitoramento

## Suporte

Para dúvidas ou problemas:
- Verifique os logs do servidor para erros de conexão
- Certifique-se de que as permissões estão configuradas corretamente
- O QR code expira em 45 segundos, recarregue se necessário
- Teste a conectividade da rede se as conexões falharem

---

**Data da Documentação:** 18 de agosto de 2025  
**Versão:** 1.0.0  
**Sistema:** Backend de Atendimento WhatsApp com NestJS + Baileys
