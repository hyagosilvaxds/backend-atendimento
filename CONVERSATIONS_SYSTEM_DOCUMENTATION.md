# 💬 Sistema de Conversação - Documentação Completa

## 📋 **Visão Geral**

O Sistema de Conversação é uma solução completa para gerenciar mensagens e conversas em tempo real integrada ao sistema de atendimento SaaS. Permite comunicação via WhatsApp com suporte a múltiplas sessões, segmentação por organização e colaboração entre usuários.

---

## 🏗️ **Arquitetura do Sistema**

### **Modelos de Dados**

#### **Conversation (Conversa)**
- **Tipo**: Individual, Grupo ou Lista de Transmissão
- **Segmentação**: Por organização e sessão WhatsApp
- **Controle**: Status, arquivo, fixação, silenciamento
- **Relacionamentos**: Contatos, usuários, participantes, mensagens

#### **Message (Mensagem)**
- **Tipos**: Texto, Imagem, Áudio, Vídeo, Documento, Localização, Contato, Sticker, Reação, Enquete
- **Status**: Pendente, Enviado, Entregue, Lido, Falhou, Excluído
- **Metadados**: Mídia, citações, encaminhamentos, edições
- **Relacionamentos**: Conversa, usuário remetente, reações

#### **ConversationUser (Usuário da Conversa)**
- **Permissões**: Leitura, escrita, gerenciamento
- **Estado**: Atribuição, última leitura
- **Relacionamentos**: Conversa, usuário

#### **ConversationParticipant (Participante)**
- **Dados**: ID, nome, telefone, permissões de admin
- **Controle**: Data de entrada/saída
- **Relacionamentos**: Conversa

#### **MessageReaction (Reação)**
- **Dados**: Emoji, remetente
- **Relacionamentos**: Mensagem

---

## 🚀 **Funcionalidades Principais**

### **1. Gerenciamento de Conversas**

#### **Criar Conversa**
```http
POST /conversations
```
```json
{
  "type": "CONTACT",
  "chatId": "5511999999999@c.us",
  "name": "João Silva",
  "sessionId": "session_id",
  "contactId": "contact_id",
  "userIds": ["user1", "user2"]
}
```

#### **Listar Conversas**
```http
GET /conversations?page=1&limit=20&search=joão&type=CONTACT&sessionId=session_id&unread=true
```

#### **Atualizar Conversa**
```http
PATCH /conversations/{id}
```
```json
{
  "name": "Novo Nome",
  "isArchived": false,
  "isPinned": true
}
```

#### **Estatísticas**
```http
GET /conversations/stats
```

### **2. Gerenciamento de Mensagens**

#### **Enviar Mensagem**
```http
POST /messages/send/{sessionId}
```
```json
{
  "chatId": "5511999999999@c.us",
  "type": "TEXT",
  "content": "Olá! Como posso ajudar?",
  "quotedMessageId": "msg_id"
}
```

#### **Listar Mensagens**
```http
GET /messages/conversation/{conversationId}?page=1&limit=50&search=texto&type=TEXT&fromMe=true
```

#### **Marcar como Lida**
```http
POST /messages/conversation/{conversationId}/read
```
```json
{
  "messageIds": ["msg1", "msg2", "msg3"]
}
```

#### **Adicionar Reação**
```http
POST /messages/{messageId}/reaction
```
```json
{
  "emoji": "👍"
}
```

### **3. Gerenciamento de Participantes (Grupos)**

#### **Adicionar Participantes**
```http
POST /conversations/{id}/participants
```
```json
{
  "participants": [
    {
      "participantId": "5511888888888@c.us",
      "participantName": "Maria Silva",
      "participantPhone": "+5511888888888",
      "isAdmin": false
    }
  ]
}
```

#### **Remover Participante**
```http
DELETE /conversations/{id}/participants/{participantId}
```

### **4. Atribuição de Usuários**

#### **Atribuir Usuário**
```http
POST /conversations/{id}/assign
```
```json
{
  "userId": "user_id",
  "canRead": true,
  "canWrite": true,
  "canManage": false
}
```

#### **Desatribuir Usuário**
```http
DELETE /conversations/{id}/assign/{userId}
```

---

## 🔌 **WebSocket (Tempo Real)**

### **Conexão**
```javascript
const socket = io('/conversations', {
  auth: {
    token: 'jwt_token'
  }
});
```

### **Eventos do Cliente**

#### **Entrar em Conversa**
```javascript
socket.emit('join_conversation', { conversationId: 'conv_id' });
```

#### **Sair de Conversa**
```javascript
socket.emit('leave_conversation', { conversationId: 'conv_id' });
```

#### **Enviar Mensagem**
```javascript
socket.emit('send_message', {
  chatId: '5511999999999@c.us',
  type: 'TEXT',
  content: 'Mensagem via WebSocket',
  sessionId: 'session_id'
});
```

#### **Indicar Digitação**
```javascript
socket.emit('typing_start', { conversationId: 'conv_id' });
socket.emit('typing_stop', { conversationId: 'conv_id' });
```

#### **Marcar como Lida**
```javascript
socket.emit('mark_as_read', {
  conversationId: 'conv_id',
  messageIds: ['msg1', 'msg2']
});
```

### **Eventos do Servidor**

#### **Nova Mensagem**
```javascript
socket.on('new_message', (message) => {
  console.log('Nova mensagem:', message);
});
```

#### **Mensagem Atualizada**
```javascript
socket.on('message_updated', (message) => {
  console.log('Mensagem atualizada:', message);
});
```

#### **Usuário Digitando**
```javascript
socket.on('user_typing', ({ userId, conversationId, typing }) => {
  console.log(`Usuário ${userId} ${typing ? 'digitando' : 'parou de digitar'}`);
});
```

#### **Mensagens Lidas**
```javascript
socket.on('messages_read', ({ userId, conversationId, messageIds }) => {
  console.log(`Usuário ${userId} leu mensagens:`, messageIds);
});
```

---

## 🔗 **Integração com WhatsApp**

### **Processar Mensagem Recebida**
```typescript
import { WhatsAppIntegrationService } from './conversations/whatsapp-integration.service';

// No webhook do WhatsApp
async handleWebhook(sessionId: string, whatsappData: any) {
  const message = await this.whatsappIntegrationService.handleIncomingMessage(
    sessionId,
    {
      id: whatsappData.id,
      chatId: whatsappData.from,
      type: whatsappData.type,
      content: whatsappData.body,
      fromMe: false,
      fromParticipant: whatsappData.author || whatsappData.from,
      fromName: whatsappData.notifyName || whatsappData.from,
      timestamp: whatsappData.timestamp * 1000,
      isGroup: whatsappData.from.includes('@g.us'),
      contactName: whatsappData.notifyName
    }
  );
  
  return message;
}
```

### **Atualizar Status de Mensagem**
```typescript
// Quando receber confirmação de entrega/leitura
await this.whatsappIntegrationService.handleMessageStatusUpdate(
  messageId,
  'DELIVERED',
  new Date()
);
```

---

## 🛡️ **Segurança e Permissões**

### **Permissões Disponíveis**
- `CREATE:CONVERSATIONS` - Criar conversas
- `READ:CONVERSATIONS` - Visualizar conversas
- `UPDATE:CONVERSATIONS` - Atualizar conversas
- `DELETE:CONVERSATIONS` - Remover conversas
- `MANAGE:CONVERSATIONS` - Gerenciar completamente conversas
- `CREATE:MESSAGES` - Criar mensagens
- `READ:MESSAGES` - Visualizar mensagens
- `UPDATE:MESSAGES` - Atualizar mensagens
- `DELETE:MESSAGES` - Remover mensagens

### **Níveis de Acesso por Role**

#### **ORG_ADMIN**
- Todas as permissões
- Pode gerenciar todas as conversas da organização
- Pode atribuir/desatribuir usuários

#### **ORG_USER**
- Criar conversas e mensagens
- Ler conversas atribuídas
- Atualizar conversas que tem permissão

#### **ORG_VIEWER**
- Apenas leitura de conversas e mensagens

---

## 📊 **Filtros e Consultas**

### **Filtros de Conversas**
- **Busca**: Nome, telefone, chatId
- **Tipo**: CONTACT, GROUP, BROADCAST
- **Status**: Arquivadas, fixadas, silenciadas
- **Sessão**: Filtrar por sessão WhatsApp
- **Não lidas**: Apenas com mensagens não lidas

### **Filtros de Mensagens**
- **Busca**: Conteúdo, legenda, nome do arquivo
- **Tipo**: TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, etc.
- **Período**: Data de início e fim
- **Origem**: Mensagens enviadas/recebidas
- **Status**: PENDING, SENT, DELIVERED, READ, FAILED
- **Especiais**: Estreladas, excluídas

---

## 🔧 **Configuração e Deploy**

### **Variáveis de Ambiente**
```env
# Já configuradas no sistema existente
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### **Instalação**
```bash
# Já incluído no sistema
npm install

# Executar migração
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate
```

### **Testes**
```bash
# Testar endpoints
npm run test

# Testar WebSocket
# Use o arquivo websocket-test-client.html
```

---

## 📝 **Exemplos de Uso**

### **Frontend (React/Vue/Angular)**
```javascript
// Conectar WebSocket
const socket = io('/conversations', {
  auth: { token: localStorage.getItem('token') }
});

// Listar conversas
const response = await fetch('/api/conversations', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: conversations } = await response.json();

// Enviar mensagem
socket.emit('send_message', {
  chatId: '5511999999999@c.us',
  type: 'TEXT',
  content: message,
  sessionId: selectedSession
});

// Escutar novas mensagens
socket.on('new_message', (message) => {
  setMessages(prev => [...prev, message]);
});
```

### **Mobile (React Native)**
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000/conversations', {
  auth: { token: await AsyncStorage.getItem('token') }
});

// Mesmo padrão do frontend web
```

---

## 🚀 **Roadmap e Melhorias Futuras**

### **Versão Atual (v1.0)**
- ✅ Sistema básico de conversas
- ✅ Mensagens em tempo real
- ✅ Integração com WhatsApp
- ✅ Permissões e segurança
- ✅ API REST completa
- ✅ WebSocket para tempo real

### **Próximas Versões**
- 🔲 Mensagens agendadas
- 🔲 Modelos de resposta rápida
- 🔲 Chatbots e automação
- 🔲 Análises e métricas avançadas
- 🔲 Integração com outros canais (Telegram, Instagram)
- 🔲 Sistema de filas de atendimento
- 🔲 Gravação de chamadas
- 🔲 Transferência entre usuários

---

## 🆘 **Suporte e Troubleshooting**

### **Problemas Comuns**

1. **WebSocket não conecta**
   - Verificar token JWT válido
   - Confirmar URL correta
   - Checar CORS

2. **Mensagens não aparecem**
   - Verificar permissões do usuário
   - Confirmar se está na sala da conversa
   - Checar logs do servidor

3. **Erro ao enviar mensagem**
   - Verificar se a sessão WhatsApp está ativa
   - Confirmar se o chatId está correto
   - Checar se o usuário tem permissão de escrita

### **Logs e Debugging**
```bash
# Ver logs em tempo real
docker logs -f backend-container

# Verificar conexões WebSocket
# Acessar console do navegador
```

---

## 📞 **Contato**

Para dúvidas, sugestões ou suporte:
- **Documentação**: Este arquivo
- **Issues**: Criar issue no repositório
- **Email**: [seu-email@empresa.com]

---

**Criado em**: 20 de agosto de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Produção
