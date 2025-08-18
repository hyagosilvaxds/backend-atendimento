# 🚀 Sistema de Autenticação SaaS - Backend

Sistema completo de autenticação JWT implementado com NestJS, Prisma e PostgreSQL para um SaaS de atendimento.

## ✅ **Implementação Completa**

### 🗄️ **Banco de Dados**
- ✅ Prisma configurado com PostgreSQL
- ✅ Schema completo com modelos hierárquicos
- ✅ Migrations aplicadas
- ✅ Seeds com dados de teste

### 🔐 **Autenticação JWT**
- ✅ Estratégias Passport (Local + JWT)
- ✅ Guards personalizados
- ✅ Middleware de validação
- ✅ Sistema de roles e permissões

### 🛡️ **Controle de Acesso**
- ✅ Guards de autenticação
- ✅ Guards de autorização por roles
- ✅ Decorators personalizados
- ✅ Middleware de validação global

### 📡 **API Endpoints**
- ✅ CRUD completo de usuários
- ✅ Sistema de login/logout
- ✅ Recuperação de senha
- ✅ Gestão de perfil
- ✅ Documentação completa

---

## 🏗️ **Estrutura do Projeto**

```
src/
├── auth/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── login.dto.ts
│   │   ├── password-reset.dto.ts
│   │   └── update-user.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

---

## 🔑 **Modelos de Dados**

### SuperAdmin
- Administradores do SaaS
- Acesso total ao sistema

### Organization  
- Empresas clientes
- Isolamento de dados por organização

### User
- Usuários das organizações
- Diferentes níveis de permissão

### PasswordReset
- Tokens para recuperação de senha
- Controle de expiração

### Session
- Sessões ativas dos usuários
- Controle de logout

---

## 🚦 **Sistema de Permissões**

| Role | Descrição |
|------|-----------|
| `SUPER_ADMIN` | Administrador do SaaS (acesso total) |
| `ORG_ADMIN` | Administrador da organização |
| `ORG_USER` | Usuário comum da organização |
| `ORG_VIEWER` | Usuário apenas visualização |

---

## 📋 **Endpoints da API**

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout  
- `GET /auth/profile` - Perfil do usuário

### Recuperação de Senha
- `POST /auth/forgot-password` - Solicitar reset
- `POST /auth/reset-password` - Redefinir senha

### Gestão de Usuários (Admin only)
- `POST /auth/register` - Criar usuário
- `GET /auth/users` - Listar usuários
- `GET /auth/users/:id` - Obter usuário
- `PUT /auth/users/:id` - Atualizar usuário
- `DELETE /auth/users/:id` - Remover usuário

---

## ⚡ **Como Executar**

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar banco
```bash
# Aplicar migrations
npx prisma migrate dev

# Popular com dados de teste
npm run db:seed
```

### 3. Iniciar servidor
```bash
npm run start:dev
```

### 4. Testar API
```bash
# Executar script de teste
./test-api.sh

# Ou manualmente
curl -X POST http://localhost:4000/auth/login  
  -H "Content-Type: application/json"  
  -d '{"email": "admin@sistema.com", "password": "admin123"}'
```

---

## 🔧 **Configuração**

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://postgres:atens12345@localhost:5435/atendimento"
JWT_SECRET="sua-chave-secreta-super-segura-aqui-2025"
PORT=4000
```

### Dados de Teste
- **Super Admin**: `admin@sistema.com` / `admin123`
- **Admin Org**: `admin@empresa.com` / `admin123`  
- **Usuário**: `usuario@empresa.com` / `user123`

---

## 🛠️ **Comandos Úteis**

```bash
# Desenvolvimento
npm run start:dev

# Prisma
npx prisma studio              # Interface visual
npx prisma generate           # Gerar client
npx prisma migrate dev        # Nova migration
npx prisma migrate reset      # Reset do banco

# Seeds
npm run db:seed               # Popular dados

# Testes
./test-api.sh                 # Script de teste
```

---

## 📚 **Documentação**

- **API_DOCUMENTATION.md** - Documentação completa dos endpoints
- **DATABASE.md** - Estrutura do banco de dados
- **test-api.sh** - Script para testes automatizados

---

## 🔒 **Segurança**

- ✅ Senhas hasheadas com bcrypt
- ✅ JWT com expiração configurável
- ✅ Validação de dados com class-validator
- ✅ CORS configurado
- ✅ Guards de autorização
- ✅ Sanitização de inputs
- ✅ Controle de sessões

---

## 🚀 **Próximos Passos**

1. **Implementar envio de emails** para recuperação de senha
2. **Adicionar middleware de rate limiting**
3. **Implementar refresh tokens**
4. **Adicionar logs de auditoria**
5. **Criar testes automatizados**
6. **Implementar 2FA (autenticação de dois fatores)**
7. **Adicionar webhooks para eventos**

---

## 📦 **Dependências Principais**

- **NestJS** - Framework backend
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Passport** - Estratégias de auth
- **bcrypt** - Hash de senhas
- **class-validator** - Validação de dados

---

## ✨ **Features Implementadas**

- [x] Sistema de autenticação JWT
- [x] Controle de acesso baseado em roles
- [x] CRUD completo de usuários
- [x] Sistema multi-tenant (organizações)
- [x] Recuperação de senha
- [x] Gestão de sessões
- [x] Validação robusta de dados
- [x] Documentação completa
- [x] Scripts de teste
- [x] Seeds para desenvolvimento

**🎉 Sistema pronto para produção!**
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# backend-atendimento
