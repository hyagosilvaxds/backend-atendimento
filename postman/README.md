# 📮 Coleção Postman - Sistema de Atendimento

Esta coleção contém todos os endpoints do sistema de autenticação e permissões para testar a funcionalidade completa da aplicação.

## 📁 Estrutura da Coleção

### 🔐 Autenticação
- **Login**: Autentica usuário e obtém token JWT
- **Login como Usuário**: Para testar permissões limitadas
- **Registro**: Cadastra novo usuário
- **Perfil**: Obtém dados do usuário logado
- **Logout**: Encerra sessão
- **Esqueceu a Senha**: Solicita reset de senha
- **Reset de Senha**: Confirma novo senha com token

### 👥 Gerenciamento de Usuários
- **Listar Usuários**: Lista todos os usuários (admin)
- **Buscar Usuário**: Obtém usuário específico por ID
- **Atualizar Usuário**: Modifica dados do usuário
- **Deletar Usuário**: Remove usuário do sistema

### 🔑 Gerenciamento de Permissões
- **Listar Permissões**: Mostra todas as permissões disponíveis
- **Permissões do Usuário**: Obtém permissões de um usuário
- **Adicionar Permissões**: Concede permissões específicas
- **Remover Permissões**: Revoga permissões do usuário
- **Setup Inicial**: Configura permissões padrão por role

### 💬 Sessões de Atendimento
- **Listar Sessões**: Lista sessões com paginação
- **Criar Sessão**: Nova sessão de atendimento
- **Buscar Sessão**: Obtém sessão por ID
- **Atualizar Sessão**: Modifica dados da sessão
- **Deletar Sessão**: Remove sessão (apenas admin)
- **Atribuir Sessão**: Designa atendente
- **Encerrar Sessão**: Finaliza com resolução

### 👤 Contatos
- **Listar Contatos**: Lista contatos com paginação
- **Criar Contato**: Novo contato no sistema
- **Buscar Contato**: Obtém contato por ID
- **Atualizar Contato**: Modifica dados do contato
- **Deletar Contato**: Remove contato
- **Importar Contatos**: Importação em lote
- **Sessões do Contato**: Histórico de atendimentos
- **Adicionar Tag**: Categoriza contato

### 🧪 Testes de Permissões
- **Teste: Usuário tenta deletar sessão**: Deve falhar (403)
- **Teste: Usuário tenta criar sessão**: Deve funcionar (201)
- **Teste: Usuário tenta gerenciar usuários**: Deve falhar (403)

### 🏠 Sistema
- **Health Check**: Verifica se o sistema está funcionando

## 🚀 Como Usar

### 1. Importar no Postman

1. Abra o Postman
2. Clique em "Import"
3. Selecione os arquivos:
   - `Sistema-Atendimento-Auth.postman_collection.json`
   - `Sistema-Atendimento-Local.postman_environment.json`

### 2. Configurar Ambiente

1. Selecione o ambiente "Sistema Atendimento - Local"
2. Verifique se a variável `base_url` está configurada para `http://localhost:4000`

### 3. Iniciar o Servidor

```bash
# No terminal do projeto
npm run start:dev
```

### 4. Executar os Testes

#### Fluxo Básico de Teste:

1. **Health Check**: Verifique se o sistema está funcionando
2. **Login como Admin**: Use credenciais de administrador
   ```json
   {
     "email": "admin@empresa.com",
     "password": "admin123"
   }
   ```
3. **Perfil**: Confirme que está logado
4. **Listar Permissões**: Veja todas as permissões disponíveis
5. **Criar Contato**: Crie um contato para usar nas sessões
6. **Criar Sessão**: Crie uma sessão de atendimento

#### Teste de Permissões:

1. **Login como Usuário**: Use credenciais de usuário comum
   ```json
   {
     "email": "usuario@empresa.com", 
     "password": "user123"
   }
   ```
2. **Teste: Usuário tenta criar sessão**: Deve funcionar ✅
3. **Teste: Usuário tenta deletar sessão**: Deve falhar ❌ (403)
4. **Teste: Usuário tenta gerenciar usuários**: Deve falhar ❌ (403)

## 🔑 Credenciais de Teste

### Administrador
- **Email**: `admin@empresa.com`
- **Senha**: `admin123`
- **Permissões**: Todas (MANAGE em todos os recursos)

### Usuário Comum
- **Email**: `usuario@empresa.com`
- **Senha**: `user123`
- **Permissões**: Limitadas (CREATE/READ SESSIONS, READ/UPDATE CONTACTS)

## 📊 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `base_url` | URL base da API | `http://localhost:4000` |
| `access_token` | Token JWT do admin | Preenchido automaticamente |
| `user_access_token` | Token JWT do usuário | Preenchido automaticamente |
| `user_id` | ID do usuário logado | Preenchido automaticamente |
| `organization_id` | ID da organização | Preenchido automaticamente |
| `session_id` | ID da sessão criada | Preenchido automaticamente |
| `contact_id` | ID do contato criado | Preenchido automaticamente |

## 🎯 Casos de Teste Importantes

### ✅ Cenários que Devem Funcionar

1. **Admin pode fazer tudo**:
   - Listar, criar, atualizar e deletar usuários
   - Gerenciar permissões de usuários
   - Todas as operações com sessões e contatos

2. **Usuário pode criar e ler sessões**:
   - Criar novas sessões de atendimento
   - Listar e visualizar sessões
   - Atualizar sessões que criou

3. **Usuário pode gerenciar contatos**:
   - Criar e editar contatos
   - Visualizar lista de contatos
   - Adicionar tags aos contatos

### ❌ Cenários que Devem Falhar (403 Forbidden)

1. **Usuário comum não pode**:
   - Deletar sessões
   - Gerenciar outros usuários
   - Modificar permissões
   - Deletar contatos

2. **Acesso sem token**:
   - Qualquer endpoint protegido sem Authorization header

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se o token está sendo enviado no header Authorization
- Token pode ter expirado, faça login novamente

### Erro 403 (Forbidden)
- Usuário não tem permissão para esta ação
- Verifique se está usando o token correto (admin vs usuário)

### Erro 500 (Internal Server Error)
- Verifique se o servidor está rodando
- Verifique se o banco de dados está conectado
- Veja os logs do servidor no terminal

### Erro "Failed to connect"
- Verifique se o servidor está rodando na porta 4000
- Execute `npm run start:dev` no diretório do projeto

## 📝 Scripts Automáticos

A coleção inclui scripts automáticos que:

1. **Salvam tokens automaticamente** após login
2. **Extraem IDs** de recursos criados
3. **Definem variáveis de ambiente** para uso posterior

Isso permite executar os testes em sequência sem precisar copiar/colar valores manualmente.

## 🔄 Executando Todos os Testes

Para executar a coleção completa:

1. No Postman, clique em "Runner"
2. Selecione a coleção "Sistema de Atendimento"
3. Escolha o ambiente "Sistema Atendimento - Local"
4. Configure a ordem dos testes:
   - Comece com "Health Check"
   - Execute "Login" antes dos testes autenticados
   - Termine com os "Testes de Permissões"
5. Clique em "Run Collection"

O Postman executará todos os endpoints em sequência e mostrará os resultados dos testes.
