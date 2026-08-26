# AnimeCards

Plataforma web de RPG de cartas desenvolvida como Trabalho de Conclusão de Curso. O projeto reúne coleção, construção de decks, gacha, batalha por turnos, perfil do jogador e um painel administrativo para manter o conteúdo do jogo.

## Estado atual

### Funcional e integrado

- cadastro, verificação de e-mail, login e recuperação de senha;
- perfil, avatar, banner, preferências, troca de e-mail e exclusão de conta;
- coleção do jogador e construção de decks com 3 a 6 cartas únicas;
- seleção de deck equipado;
- gacha com custo em rubys, giro unitário ou de dez, pity e recompensa diária;
- batalha 1x1 por turnos contra adversário controlado pelo servidor;
- persistência de partidas, snapshots das cartas e eventos de auditoria por turno;
- recompensas em rubys registradas em ledger relacional;
- painel administrativo de usuários, cartas, habilidades e notícias;
- ajuste administrativo de coleção e rubys com motivo e log de autoria;
- criação, teste, publicação e vínculo de habilidades às cartas;
- notícias públicas com imagem, conteúdo, anexos e página por ID;
- landing page alimentada pelas cartas e notícias publicadas no banco.

### Parcial ou demonstrativo

- o motor de batalha executa passivas do formato legado salvo na carta; o catálogo novo de habilidades já possui validação, simulação, testes e vínculo, mas ainda precisa ser consumido integralmente pela batalha;
- o adversário atual é básico e a dificuldade é calculada no servidor, sem IA avançada;
- a tela administrativa de banners do gacha ainda usa dados demonstrativos e não possui CRUD próprio;
- pacotes e transações de rubys estão modelados no banco, mas o pagamento por Pix/Stripe ainda não foi integrado;
- não existe PvP em tempo real;
- não existe MongoDB ou Redis: auditoria, economia e batalha usam PostgreSQL.

## Arquitetura

```text
Navegador (Next.js)
        |
        | HTTP /api
        v
API NestJS -> DTO + ValidationPipe -> Guards -> Services
        |                                  |
        |                                  +-> motor autoritativo de batalha
        v
Prisma ORM -> PostgreSQL -> constraints, transações, ledger e logs
        |
        +-> Cloudinary (cartas e notícias)
        +-> Supabase Storage (avatar e banner do perfil)
        +-> SMTP (verificação e recuperação de conta)
```

O cliente envia intenções, como criar um deck, girar o gacha ou executar um turno. O backend identifica o usuário pelo JWT, valida a entrada, confere propriedade e saldo, executa a regra e persiste o resultado. O navegador não decide dano, recompensa, sorteio ou saldo.

## Tecnologias

- Frontend: Next.js 16, React 19, TypeScript e CSS Modules.
- Backend: NestJS 11, Prisma 7, PostgreSQL e Jest.
- Autenticação: Passport JWT e bcrypt.
- Imagens: Cloudinary e Supabase Storage.
- E-mail: Nodemailer via SMTP.

## Estrutura

```text
backend/
  prisma/                 schema, migrations e seed de habilidades
  src/common/             guards, decorators e filtro HTTP
  src/modules/auth/       autenticação e recuperação de conta
  src/modules/perfil/     dados e mídia do jogador
  src/modules/jogo/       coleção, decks, gacha, batalha e notícias públicas
  src/modules/admin/      manutenção e auditoria administrativa
frontend/
  app/(public)/           landing e autenticação
  app/(private)/          telas do jogador
  app/(admin)/            painel administrativo
  app/components/         componentes reutilizáveis, incluindo CartaMontada
  app/lib/                clientes HTTP e tipos
  app/styles/             CSS Modules por tela ou responsabilidade
scripts/
  startproject.js         inicialização local dos dois servidores
```

## Executar localmente

### Requisitos

- Node.js 20.9 ou superior;
- PostgreSQL acessível pela `DATABASE_URL`;
- npm.

### Instalação

```powershell
npm install
npm --prefix backend install
npm --prefix frontend install
Copy-Item backend/.env.example backend/.env
```

Preencha ao menos `DATABASE_URL` e `JWT_SECRET` em `backend/.env`. A API não inicia sem uma chave JWT explícita fora do ambiente de testes.

```powershell
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
npm --prefix backend run seed:habilidades
```

Para iniciar frontend e backend juntos:

```powershell
npm link
startproject
```

Também é possível iniciar separadamente:

```powershell
npm --prefix backend run start:dev
npm --prefix frontend run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Variáveis de ambiente

Principais variáveis do backend:

| Variável                                     | Uso                             |
| -------------------------------------------- | ------------------------------- |
| `DATABASE_URL`                               | conexão PostgreSQL              |
| `JWT_SECRET`                                 | assinatura dos tokens de acesso |
| `FRONTEND_URL` ou `FRONTEND_URLS`            | origens aceitas pelo CORS       |
| `SMTP_*` e `MAIL_FROM`                       | envio de e-mails                |
| `CLOUDINARY_*`                               | imagens de cartas e notícias    |
| `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` | avatar e banner do perfil       |
| `GOOGLE_*`                                   | OAuth opcional com Google       |

No frontend, `BACKEND_URL` define o destino interno do proxy `/api`. `NEXT_PUBLIC_API_URL` é opcional e deve ser usado apenas quando o navegador precisar acessar outra origem diretamente.

## Segurança aplicada

- validação global com remoção e rejeição de campos não declarados;
- autenticação JWT e autorização administrativa em todas as rotas de manutenção;
- revalidação do estado e da permissão atual do usuário a cada requisição autenticada;
- senha protegida com bcrypt e tokens aleatórios para e-mail e recuperação;
- respostas genéricas na solicitação de recuperação de senha;
- limites de tamanho, quantidade e MIME nos uploads;
- verificação de propriedade em decks e partidas;
- transações serializáveis em operações econômicas do gacha;
- ledger de rubys e logs administrativos sem confiar no saldo enviado pelo cliente;
- soft delete para cartas e contas quando aplicável.

### Pendências de segurança antes de produção

- aplicar rate limiting nas rotas públicas de login, cadastro, reenvio e recuperação;
- migrar o token do `localStorage` para cookie `HttpOnly`, `Secure` e `SameSite` junto de uma estratégia CSRF;
- definir headers HTTP de proteção com Helmet e uma Content Security Policy compatível com as imagens externas;
- substituir o bloqueio permanente após cinco erros por janela temporária e limite por IP/conta;
- validar o conteúdo real dos arquivos por assinatura, além do MIME informado pelo cliente;
- adicionar testes E2E de autorização horizontal, concorrência do gacha e fluxo completo da partida;
- revisar CORS e segredos no ambiente definitivo de implantação.

## Validação

```powershell
npm --prefix backend test -- --runInBand
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend exec tsc -- --noEmit
npm --prefix frontend run build
npm --prefix backend audit --omit=dev
npm --prefix frontend audit --omit=dev
```

Os testes atuais cobrem o motor básico de batalha, validação e simulação de habilidades, regras administrativas de cartas, perfil e partes do gacha. A cobertura ainda não representa todos os fluxos HTTP do sistema.

## Regra econômica

Rubys são a única moeda do jogo. Eles podem ser recebidos em batalhas e recompensas ou adquiridos futuramente por pagamento. Todas as cartas devem continuar obtíveis jogando; compras devem economizar tempo, sem oferecer atributos ou cartas competitivas exclusivas.
