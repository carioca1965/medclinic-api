# MedClinic API

API REST de uma clinica medica. **Etapa 2: agendamento, escala e prontuario**, construida sobre a base de autenticacao e autorizacao da Etapa 1.

- **API publicada:** https://medclinic-api-y4co.onrender.com (saude: `GET /api/v1/health`)
- **Board do projeto:** https://github.com/users/carioca1965/projects/3
- **Autor:** Carlos Eduardo Pereira Pedroza

> A API roda no plano gratuito do Render: depois de um periodo sem uso o servico "dorme" e a primeira requisicao pode levar cerca de um minuto.

## Escopo desta etapa

Pacientes (CPF unico), medicos (usuario de acesso e CRM criados na mesma transacao), escala de trabalho por turno, agenda do medico por periodo, agendamento com validacao contra a escala e protecao contra concorrencia, ciclo de vida da consulta e prontuario com acesso por vinculo. Autenticacao por JWT com tres perfis: `admin`, `secretary` e `doctor`.

## Tecnologias

Node.js 22, TypeScript (`strict: true`), Express 5, TypeORM, PostgreSQL 16, JWT (`jsonwebtoken`), bcrypt, zod (validacao), Vitest (testes e cobertura), Docker, GitHub Actions, Render e Neon.

## Pre-requisitos

- Node.js 22 ou superior
- Docker (para o PostgreSQL local) ou um PostgreSQL 16 instalado
- Git

## Executando localmente

```bash
git clone https://github.com/carioca1965/medclinic-api.git
cd medclinic-api
npm install
docker compose up -d        # sobe o PostgreSQL (usuario postgres, senha postgres, banco medclinic)
cp .env.example .env        # no Windows: copy .env.example .env  (depois preencha os valores)
npm run dev                 # as migrations rodam sozinhas ao iniciar
```

A API sobe em `http://localhost:3000/api/v1`. O primeiro administrador e criado pela migration de seed, com o e-mail e a senha de `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

### Variaveis de ambiente

Espelham o `.env.example`. O `.env` nao e versionado.

| Variavel | Papel |
|---|---|
| `PORT` | Porta de escuta (a aplicacao escuta em `0.0.0.0`). Na nuvem e definida pela plataforma. |
| `DB_HOST`, `DB_PORT` | Endereco do PostgreSQL. |
| `DB_USERNAME`, `DB_PASSWORD` | Credenciais do PostgreSQL. |
| `DB_DATABASE` | Nome do banco. |
| `DB_SSL` | `true` liga SSL na conexao (obrigatorio em banco gerenciado). |
| `JWT_SECRET` | Segredo que assina os tokens. |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `1h`). |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Dados do primeiro administrador criado pelo seed. |

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Executa em desenvolvimento, com recarga automatica. |
| `npm run build` | Compila o TypeScript para `dist/`. |
| `npm start` | Executa o codigo compilado (`node dist/server.js`). |
| `npm test` | Roda os testes unitarios. |
| `npm run test:cov` | Roda os testes com cobertura e reprova abaixo de 80%. |
| `npm run migration:run` | Aplica as migrations pendentes. |
| `npm run migration:revert` | Desfaz a ultima migration. |

`synchronize` esta desligado. O banco e criado somente pelas migrations (em `src/database/migrations`), que tambem rodam na inicializacao da aplicacao, inclusive em producao.

## Arquitetura

Camadas com injecao de dependencia pelo construtor. O unico lugar que monta as dependencias e o `src/server.ts`.

```
src/
  config/        leitura e validacao das variaveis de ambiente
  controllers/   recebem a requisicao, validam a entrada (zod) e devolvem a resposta; sem regra de negocio
  database/      DataSource do TypeORM e migrations
  dtos/          contratos de entrada e saida (schemas zod e tipos de resposta)
  entities/      entidades do TypeORM
  errors/        erros de dominio (codigo, sem status HTTP)
  middlewares/   autenticacao (JWT), autorizacao por perfil e tratamento central de erros
  repositories/  portas (interfaces) e implementacoes com TypeORM; sem regra de negocio
  routes/        mapa de rotas e perfis exigidos
  security/      hash de senha, tokens e o "ator" autenticado
  services/      regra de negocio (camada coberta pelos testes)
  utils/         horario local da clinica
```

Fluxo de uma requisicao: autenticacao -> autorizacao por perfil -> validacao do corpo -> controller -> service -> repository -> PostgreSQL. Erros lancados em qualquer ponto sobem ate o `error.middleware`, o unico que conhece HTTP: ele traduz o codigo de dominio no status e devolve o envelope `{ statusCode, error, message }`.

### Decisoes de modelagem

- **IDs numericos** (`serial`): o contrato mostra identificadores numericos.
- **Usuario e perfis:** `users.roles` e um array de texto, o que permite mais de um perfil por usuario.
- **Medico:** tabela `doctors` ligada 1:1 ao usuario. O cadastro grava usuario e medico na mesma transacao, entao falha em um desfaz o outro (RF03). A unicidade de e-mail, CPF e CRM e garantida por restricao no banco (RP04).
- **Paciente:** remocao logica (`deleted_at`). A unicidade do CPF e um indice unico parcial (`WHERE deleted_at IS NULL`), entao o CPF de um paciente removido pode ser cadastrado de novo.
- **Escala:** tabela `work_shifts`, uma linha por turno, com dia da semana (0 = domingo), `start_time` e `end_time` em hora local da clinica (tipo `time`, sem data e sem fuso) e duracao da consulta. Gravar a escala substitui a anterior inteira, numa transacao.
- **Agendamento:** `starts_at` e `ends_at` em `timestamptz`. O fim e calculado no momento de agendar e gravado, entao mudar a escala depois nao altera consultas ja marcadas (RN15).
- **Prontuario:** o autor (`doctor_id`) vem sempre do token, nunca do corpo. O vinculo e verificado por consulta `in_progress` ou `done` entre medico e paciente.
- **Horario local:** a conversao entre o instante (UTC) e o relogio da clinica (`America/Sao_Paulo`) fica em `src/utils/clinic-time.ts`.

### Concorrencia no agendamento

Verificar e gravar sao dois passos, e outra requisicao cabe entre eles. Por isso o agendamento roda numa transacao que primeiro trava com `SELECT ... FOR UPDATE` a linha do medico (existe mesmo com a agenda vazia) e depois a do paciente, sempre nessa ordem para evitar impasse. So entao verifica os conflitos e grava. Quem chega depois espera o commit, enxerga o horario ocupado e recebe `HORARIO_INDISPONIVEL`. Todas as consultas dentro da transacao usam o `EntityManager` da transacao. Testado com 20 requisicoes simultaneas ao mesmo horario: sempre exatamente um `201`.

### Padrao de nomes

- Arquivos em `kebab-case` com o papel como sufixo: `appointment.service.ts`, `patient.controller.ts`, `typeorm-doctor.repository.ts`, `work-shift.entity.ts`, `patient.dto.ts`, `error.middleware.ts`, `*.spec.ts` para testes.
- Classes em `PascalCase` (`AppointmentService`); funcoes e variaveis em `camelCase`; constantes em `UPPER_SNAKE_CASE`.
- Rotas em ingles, no plural e em `kebab-case` (`/patients`, `/work-schedule`, `/medical-records`); campos JSON em `camelCase`.
- Banco: tabelas no plural e colunas em `snake_case`; indices e restricoes com prefixo (`UQ_`, `FK_`, `IDX_`).
- Migrations: `<timestamp>-<Descricao>.ts`.

## Testes e cobertura

Testes unitarios com Vitest sobre a camada de regra de negocio, com dubles sobre as portas de repositorio. Nenhum teste depende de banco, rede ou variavel de ambiente. Cobrem, entre outros: os cinco cenarios de sobreposicao de periodos, as seis validacoes do agendamento, a escala (sobrepostos recusados, encostados aceitos), as transicoes de status e permissoes, o prontuario por vinculo e o login.

**Recorte da cobertura:** somente os arquivos `src/**/*.service.ts`, porque e onde mora a regra de negocio. Controllers, entidades, migrations e repositorios nao entram na conta (nao ha regra neles; controllers so traduzem HTTP e repositorios so falam com o banco). O limiar e de 80% em lines, branches, functions e statements, configurado em `vitest.config.mts`, e o workflow do pull request reprova abaixo disso.

## Integracao e publicacao continuas

- `.github/workflows/pr-workflow.yml`: a cada pull request para a `main`, roda `npm ci`, o build e os testes com cobertura minima. O check `validate` e obrigatorio na protecao da `main`.
- `.github/workflows/deploy.yml`: a cada push na `main`, constroi a imagem do `Dockerfile`, publica no GitHub Container Registry e dispara o deploy no Render por meio do Deploy Hook (segredo `RENDER_DEPLOY_HOOK_URL`). As variaveis da aplicacao ficam so no painel do Render.
- `Dockerfile` multi-stage: etapa de build e etapa de execucao com `node dist/server.js` e apenas dependencias de producao.
- Banco de producao: PostgreSQL gerenciado no Neon, com SSL.

## Endpoints

Todos sob `/api/v1`. Erros seguem o envelope `{ "statusCode", "error", "message" }`. Listagens sao paginadas (`page`, `pageSize`, maximo 100) e devolvem `{ data, meta }`.

| Metodo | Rota | Perfis |
|---|---|---|
| GET | `/health` | publico |
| POST | `/auth/login` | publico |
| GET | `/users/me` | autenticado |
| POST | `/users` | admin |
| POST | `/patients` | admin, secretary |
| GET | `/patients` | autenticado |
| GET | `/patients/{id}` | autenticado |
| PATCH | `/patients/{id}` | admin, secretary |
| DELETE | `/patients/{id}` | admin |
| POST | `/doctors` | admin |
| GET | `/doctors` | autenticado |
| GET | `/doctors/{id}` | autenticado |
| PUT | `/doctors/{id}/work-schedule` | admin |
| GET | `/doctors/{id}/work-schedule` | autenticado |
| GET | `/doctors/{id}/calendar?from=&to=` | autenticado |
| POST | `/appointments` | admin, secretary |
| GET | `/appointments` | autenticado (medico ve so as proprias) |
| GET | `/appointments/{id}` | autenticado (medico so a propria) |
| PATCH | `/appointments/{id}/status` | conforme a transicao |
| POST | `/patients/{id}/medical-records` | doctor com vinculo |
| GET | `/patients/{id}/medical-records` | doctor com vinculo, admin |

### Transicoes de status

| De | Para | Quem pode |
|---|---|---|
| scheduled | in_progress | medico da consulta, admin |
| scheduled | cancelled | admin, secretary, medico da consulta |
| in_progress | done | medico da consulta, admin |
| in_progress | cancelled | admin, medico da consulta |
| done / cancelled | qualquer | ninguem |
