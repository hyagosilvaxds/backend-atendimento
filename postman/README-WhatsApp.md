# Coleção Postman - WhatsApp Sessions

Esta coleção contém todos os endpoints para testar o módulo de sessões WhatsApp do sistema de atendimento.

## Importação

1. Importe a coleção: `WhatsApp-Sessions.postman_collection.json`
2. Importe o ambiente: `WhatsApp-Environment.postman_environment.json`
3. Selecione o ambiente "WhatsApp Environment" no Postman

## Estrutura da Coleção

### 1. Authentication
- **Login Admin**: Faz login como administrador e captura o token automaticamente
- **Login User**: Faz login como usuário comum e captura o token automaticamente

### 2. WhatsApp Sessions - Admin
Testes completos com permissões de administrador:
- **Create Session**: Cria uma nova sessão WhatsApp
- **List All Sessions**: Lista todas as sessões da organização
- **Get Session Details**: Obtém detalhes de uma sessão específica
- **Get QR Code**: Obtém o QR Code para conexão WhatsApp
- **Connect Session**: Inicia a conexão da sessão
- **Disconnect Session**: Desconecta a sessão
- **Update Session**: Atualiza informações da sessão
- **Delete Session**: Remove uma sessão

### 3. WhatsApp Sessions - User (Limited)
Testes com permissões limitadas de usuário:
- **User - List Sessions**: Lista sessões (deve mostrar apenas da própria organização)
- **User - Try Create Session**: Tenta criar sessão (deve falhar com 403)

### 4. Test Scenarios
Cenários de teste específicos:
- **Create Multiple Sessions**: Testa criação de múltiplas sessões
- **Create Session - Validation Test**: Testa validação de campos obrigatórios
- **Get Non-existent Session**: Testa busca de sessão inexistente

### 5. Cleanup
- **List All Sessions for Cleanup**: Lista sessões para possível limpeza

## Fluxo de Teste Recomendado

### Teste Completo como Admin
1. Execute "Login Admin" primeiro
2. Execute "Create Session" para criar uma sessão
3. Execute "Get Session Details" para ver os detalhes
4. Execute "Get QR Code" para obter o QR Code
5. Execute "Connect Session" para tentar conectar
6. Execute "List All Sessions" para ver todas as sessões
7. Execute "Update Session" para modificar dados
8. Execute "Disconnect Session" para desconectar
9. Execute "Delete Session" para limpar

### Teste de Permissões como User
1. Execute "Login User" primeiro
2. Execute "User - List Sessions" (deve funcionar)
3. Execute "User - Try Create Session" (deve falhar com 403)

### Teste de Validações
1. Execute "Create Session - Validation Test" (deve falhar com 400)
2. Execute "Get Non-existent Session" (deve falhar com 404)

## Variáveis de Ambiente

A coleção utiliza as seguintes variáveis que são definidas automaticamente:

- `base_url`: URL base da API (http://localhost:4000)
- `access_token`: Token JWT do administrador
- `user_access_token`: Token JWT do usuário comum
- `user_id`: ID do usuário administrador
- `user_user_id`: ID do usuário comum
- `organization_id`: ID da organização do admin
- `user_organization_id`: ID da organização do usuário
- `session_id`: ID da sessão criada (capturado automaticamente)
- `session_number`: Número da sessão criada
- `cleanup_session_ids`: IDs das sessões para limpeza

## Scripts Automáticos

A coleção inclui scripts que:
- Capturam automaticamente tokens de autenticação
- Armazenam IDs de sessões criadas
- Validam respostas esperadas
- Exibem logs informativos no console
- Gerenciam variáveis de ambiente

## Status de Sessão WhatsApp

- `CREATED`: Sessão criada, aguardando conexão
- `CONNECTING`: Tentando conectar ao WhatsApp
- `CONNECTED`: Conectada e ativa
- `DISCONNECTED`: Desconectada
- `FAILED`: Falha na conexão

## Permissões Testadas

### Admin (SUPER_ADMIN/ORG_ADMIN)
- ✅ CREATE_WHATSAPP_SESSIONS
- ✅ READ_WHATSAPP_SESSIONS  
- ✅ UPDATE_WHATSAPP_SESSIONS
- ✅ DELETE_WHATSAPP_SESSIONS
- ✅ MANAGE_WHATSAPP_SESSIONS

### User (USER)
- ✅ READ_WHATSAPP_SESSIONS (apenas da própria organização)
- ❌ CREATE_WHATSAPP_SESSIONS (Forbidden)
- ❌ UPDATE_WHATSAPP_SESSIONS (Forbidden)
- ❌ DELETE_WHATSAPP_SESSIONS (Forbidden)
- ❌ MANAGE_WHATSAPP_SESSIONS (Forbidden)

## Notas Importantes

1. **Servidor**: Certifique-se que o servidor está rodando em `localhost:4000`
2. **Banco de Dados**: O banco deve estar configurado e as migrações aplicadas
3. **Baileys**: As dependências do Baileys devem estar instaladas
4. **Permissões**: Execute o script de permissões se necessário
5. **QR Code**: Em produção, o QR Code seria exibido via WebSocket ou polling

## Troubleshooting

### Erro 403 - Forbidden
- Verifique se o token está sendo enviado corretamente
- Confirme se o usuário tem as permissões necessárias
- Execute o script de permissões se necessário

### Erro 404 - Not Found
- Verifique se o endpoint está correto
- Confirme se a sessão existe e pertence à organização

### Erro 500 - Internal Server Error
- Verifique os logs do servidor
- Confirme se o banco de dados está acessível
- Verifique se as dependências estão instaladas

### Falhas de Conexão WhatsApp
- São normais em ambiente de desenvolvimento
- O Baileys precisa de um número real para conectar
- Em produção, implemente WebSockets para atualizações em tempo real
