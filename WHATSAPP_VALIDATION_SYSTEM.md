# Sistema de Validação de Números WhatsApp

## Visão Geral

O sistema de validação de números WhatsApp foi implementado para garantir que apenas números válidos e ativos no WhatsApp sejam salvos como contatos. A validação inclui:

1. **Validação de Formato Brasileiro**: Verifica se o número segue o padrão brasileiro (55 + DDD + 8-9 dígitos)
2. **Validação de Existência no WhatsApp**: Confirma se o número realmente existe no WhatsApp

## Funcionalidades Implementadas

### 1. Validação Automática na Criação de Contatos

Quando um contato é criado via `POST /contacts`, o sistema automaticamente:
- Valida o formato do número
- Verifica se o número existe no WhatsApp
- Bloqueia a criação se o número for inválido

### 2. Validação Automática na Atualização de Contatos

Quando um contato é atualizado via `PUT /contacts/:id` e o telefone é alterado:
- Valida o novo número antes de salvar
- Mantém o número anterior se a validação falhar

### 3. Endpoint de Validação Standalone

Endpoint `POST /contacts/validate-phone` para validar números sem criar contatos:
- Útil para validação em tempo real no frontend
- Permite verificar números antes do usuário preencher outros campos

## Implementação Técnica

### Arquivos Modificados

1. **src/whatsapp/whatsapp.service.ts**
   - Método `validateWhatsAppNumber()`: Validação completa do número
   - Método `validateBrazilianPhoneFormat()`: Validação de formato brasileiro

2. **src/contacts/contacts.service.ts**
   - Método `create()`: Validação antes de criar contato
   - Método `update()`: Validação antes de atualizar telefone
   - Método `validatePhoneNumber()`: Validação standalone

3. **src/contacts/contacts.controller.ts**
   - Endpoint `POST /contacts/validate-phone`

4. **src/contacts/contacts.module.ts**
   - Importação do WhatsAppModule para dependência

5. **src/contacts/dto/validate-phone.dto.ts**
   - DTO para validação de telefone

### Lógica de Validação

#### Formato Brasileiro
```typescript
// Padrão aceito: 55 + DDD (11-99) + número (8-9 dígitos)
const brazilianPhoneRegex = /^55([1-9][1-9])(9?\d{8})$/;
```

#### DDDs Válidos
- **11-19**: São Paulo e região
- **21-28**: Rio de Janeiro e região
- **31-39**: Minas Gerais e região
- **41-49**: Paraná e região
- **51-59**: Rio Grande do Sul e região
- **61-69**: Centro-Oeste
- **71-79**: Nordeste
- **81-89**: Nordeste
- **91-99**: Norte

#### Validação no WhatsApp
```typescript
const jid = `${formattedNumber}@s.whatsapp.net`;
const results = await socket.onWhatsApp(jid);
return results && results.length > 0 && results[0].exists;
```

## API Endpoints

### Validação Standalone
```http
POST /contacts/validate-phone
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "5511999999999"
}
```

#### Resposta de Sucesso
```json
{
  "isValid": true,
  "exists": true,
  "formattedNumber": "5511999999999"
}
```

#### Resposta de Erro
```json
{
  "isValid": false,
  "error": "O número deve ter o código do país brasileiro (55)"
}
```

### Criação de Contato com Validação
```http
POST /contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com"
}
```

Se o número for inválido, retorna erro 400:
```json
{
  "message": "O número informado não é um número válido do WhatsApp",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Exemplos de Uso

### Números Válidos
- `5511999999999` - São Paulo com 9 dígitos
- `5521987654321` - Rio de Janeiro com 9 dígitos
- `5585988776655` - Ceará com 8 dígitos
- `+55 11 99999-9999` - Com formatação (será limpo)

### Números Inválidos
- `11999999999` - Sem código do país
- `5511` - Muito curto
- `55119999999999` - Muito longo
- `5500123456789` - DDD inválido (00)
- `5599123456789` - DDD inválido (99)

## Mensagens de Erro

### Formato Inválido
- "O número deve ter o código do país brasileiro (55)"
- "DDD inválido. Use DDDs de 11 a 99"
- "Número deve ter 8 ou 9 dígitos após o DDD"
- "Número deve conter apenas dígitos"

### Problemas de Conexão
- "Nenhuma sessão WhatsApp ativa encontrada para validação"
- "Sessão WhatsApp não está conectada"

### Número Não Existe
- "Número não encontrado no WhatsApp"

## Integração com Frontend

### Validação em Tempo Real
```javascript
const validatePhone = async (phone) => {
  try {
    const response = await fetch('/contacts/validate-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone })
    });
    
    const result = await response.json();
    
    if (result.isValid) {
      console.log('✅ Número válido:', result.formattedNumber);
      return true;
    } else {
      console.log('❌ Número inválido:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Erro na validação:', error);
    return false;
  }
};
```

### Validação no Formulário
```javascript
const handlePhoneChange = async (phone) => {
  setPhoneError('');
  
  if (phone.length >= 10) { // Validar quando tiver tamanho mínimo
    const isValid = await validatePhone(phone);
    if (!isValid) {
      setPhoneError('Número de WhatsApp inválido');
    }
  }
};
```

## Requisitos do Sistema

### Dependências
- Sessão WhatsApp ativa na organização
- Conexão estável com o WhatsApp
- Biblioteca Baileys configurada

### Permissões
- `CREATE_CONTACTS`: Para usar endpoint de validação
- `UPDATE_CONTACTS`: Para atualizar contatos com validação

## Testes

Execute o script de teste:
```bash
./test-phone-validation.sh
```

O script testa:
- Números brasileiros válidos
- Números com formato inválido
- Números com formatação
- Diferentes DDDs
- Conectividade com API

## Troubleshooting

### Erro: "Nenhuma sessão WhatsApp ativa encontrada"
- Verifique se há sessões WhatsApp conectadas
- Conecte uma sessão via `/whatsapp/sessions`

### Erro: "Sessão WhatsApp não está conectada"
- Verifique status da sessão
- Reconecte a sessão se necessário

### Validação sempre retorna inválido
- Verifique conectividade com WhatsApp
- Confirme se o número realmente existe no WhatsApp
- Teste com um número conhecido válido

## Considerações de Performance

- A validação faz uma chamada para o WhatsApp, pode levar 1-3 segundos
- Implemente debounce no frontend para evitar muitas chamadas
- Cache resultados válidos por um período curto se necessário
- Considere validação assíncrona para não bloquear UX

## Roadmap

### Melhorias Futuras
1. **Cache de Validações**: Cachear resultados por 24h
2. **Validação em Lote**: Validar múltiplos números de uma vez
3. **Outros Países**: Suporte para outros códigos de país
4. **Webhook de Status**: Notificar quando números ficam inválidos
5. **Métricas**: Coletar estatísticas de validação
