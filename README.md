# MedClinic API

Mini-Projeto Avaliativo — Módulo 02 (Back-End Node)
Etapa 1: Autenticação e Autorização

## Sobre o projeto

API REST para o sistema MedClinic, responsável pelo cadastro de usuários,
login com emissão de token JWT, e controle de acesso baseado em perfis
(RBAC) — Administrador e Atendente.

## Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- TypeORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt

## Arquitetura

O projeto segue uma arquitetura em camadas (MVC estendido):

```
src/
├── routes/         # Definição dos endpoints
├── middlewares/     # Autenticação, autorização (RBAC) e tratamento de erros
├── controllers/     # Recebem a requisição e devolvem a resposta HTTP
├── services/        # Regras de negócio
├── repositories/     # Comunicação com o banco de dados (TypeORM)
├── entities/         # Entidades / modelos do TypeORM
├── database/         # Configuração da conexão (DataSource)
└── utils/            # DTOs, utilitários de senha, JWT e erros customizados
```

## Como rodar o projeto localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL 16 (ou compatível)
- Git

### Passo a passo

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd medclinic-api
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o banco de dados no PostgreSQL:
   ```sql
   CREATE DATABASE medclinic;
   ```

4. Copie o arquivo de variáveis de ambiente e preencha com seus dados:
   ```bash
   cp .env.example .env
   ```

5. Rode o projeto em modo desenvolvimento:
   ```bash
   npm run dev
   ```

   O servidor sobe em `http://localhost:3000` e a conexão com o banco é
   confirmada no console. A tabela `users` é criada automaticamente pelo
   TypeORM (opção `synchronize: true`, recomendada apenas em ambiente de
   estudo/desenvolvimento).

## Endpoints

| Método | Rota            | Proteção                          | Descrição                          |
|--------|-----------------|------------------------------------|-------------------------------------|
| POST   | `/auth/register`| Pública                            | Cadastra um novo usuário (perfil Atendente por padrão) |
| POST   | `/auth/login`    | Pública                            | Autentica o usuário e retorna um token JWT |
| GET    | `/users/me`      | JWT                                 | Retorna os dados do usuário autenticado |
| GET    | `/admin/ping`    | JWT + Perfil Administrador          | Endpoint de teste restrito a administradores |

### Exemplo — Cadastro

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Carlos","email":"carlos@medclinic.com","senha":"123456"}'
```

### Exemplo — Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@medclinic.com","senha":"123456"}'
```

### Exemplo — Rota protegida

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <token_recebido_no_login>"
```

## Tratamento de erros

Todos os erros de negócio (validação, credenciais inválidas, e-mail
duplicado, acesso não autorizado) são centralizados em um middleware de
erro, retornando um JSON no formato `{ "message": "..." }` com o status
HTTP apropriado (400, 401, 403 ou 409).

## Perfis de acesso (RBAC)

- **Administrador**: acesso liberado a rotas administrativas (ex.: `/admin/ping`).
- **Atendente**: perfil padrão de todo novo cadastro; acesso apenas às rotas de usuário comum.

> Observação: nesta etapa não há endpoint público para promover um usuário
> a Administrador (será tratado em etapa futura). Para testes, a promoção
> pode ser feita diretamente no banco:
> ```sql
> UPDATE users SET role = 'administrador' WHERE email = 'seu-email@exemplo.com';
> ```

## Autor

Carlos Eduardo Pereira Pedroza
