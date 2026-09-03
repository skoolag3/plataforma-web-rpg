# AnimeCards

Plataforma web de RPG de cartas desenvolvida como Trabalho de Conclusão de Curso. O projeto reúne coleção, construção de decks, gacha, batalha por turnos, perfil do jogador e um painel administrativo para manter o conteúdo do jogo.

## Estado atual

### Funcional e integrado

- cadastro, verificação de e-mail, login e recuperação de senha;
- perfil, avatar, banner, preferências, troca de e-mail e exclusão de conta;
- coleção do jogador e construção de decks com 3 a 6 cartas únicas;
- seleção de deck equipado;
- gacha com custo em rubys, giro unitário ou de dez, pity e recompensa diária;
- recompensa semanal e mensagens periódicas disponíveis na caixa de entrada;
- batalha 1x1 por turnos contra adversário controlado pelo servidor, com decisões de atacar ou defender;
- persistência de partidas, snapshots das cartas e eventos de auditoria por turno;
- recompensas em rubys registradas em ledger relacional;
- expedição procedural com três etapas de escolhas, confronto final e recompensa própria;
- painel administrativo de usuários, cartas, habilidades e notícias;
- ajuste administrativo de coleção e rubys com motivo e log de autoria;
- criação, teste, publicação e vínculo de habilidades automáticas às cartas;
- execução das habilidades publicadas pelo motor de batalha, incluindo dano, cura, buff, debuff, escudo, evasão e roubo de vida;
- classes de cartas configuráveis pelo painel, com prioridade de ataque e modificadores de HP, ataque e defesa;
- notícias públicas com imagem, conteúdo, anexos e página por ID;
- landing page alimentada pelas cartas e notícias publicadas no banco.
- loja de Rubys com pacotes, Checkout hospedado pelo Stripe e crédito confirmado por webhook idempotente;
- ranking público de jogadores com pontuação positiva e histórico paginado de partidas no perfil;
- rotação automática do banner de gacha a cada 30 minutos, com opção administrativa para forçar o banner;
- painel administrativo de usuários com busca, filtros, edição, bloqueio, coleção, ajuste de saldo e auditoria;
- notificações globais temporárias com fechamento manual e indicador de duração.

### Parcial ou demonstrativo

- o adversário atual é básico e a dificuldade é calculada no servidor, sem IA avançada;
- a tela administrativa de banners permite consultar a rotação e forçar um banner, mas ainda não possui CRUD completo de banners e pacotes;
- o pagamento por Stripe está integrado em modo de teste; Pix e operação em produção ainda não foram configurados;
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
  src/modules/jogo/       coleção, decks, gacha, expedição, batalha e notícias públicas
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

Em ambientes publicados, aplique as migrações já versionadas sem criar uma nova:

```powershell
npm --prefix backend run prisma:deploy
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

## Publicação

O frontend está preparado para a Vercel, o backend para o Render e o PostgreSQL para o Supabase. O passo a passo completo e as variáveis necessárias estão em [`DEPLOY.md`](DEPLOY.md).

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
| `STRIPE_SECRET_KEY`                          | criação das sessões de Checkout |
| `STRIPE_WEBHOOK_SECRET`                      | validação dos eventos do Stripe |

No frontend, `BACKEND_URL` define o destino interno do proxy `/api`. `NEXT_PUBLIC_API_URL` é opcional e deve ser usado apenas quando o navegador precisar acessar outra origem diretamente.

Para testar pagamentos localmente, mantenha o backend ativo e encaminhe os eventos do Stripe CLI:

```powershell
stripe listen --forward-to http://localhost:3001/loja/stripe/webhook
```

Copie o segredo `whsec_...` exibido pela CLI para `STRIPE_WEBHOOK_SECRET` e reinicie o backend. Chaves secretas e segredos de webhook não devem ser versionados.

## Atualizações recentes

- criação da Expedição com trilha procedural, três decisões, chefe final, integração com batalhas e recompensa de 100 Rubys;
- ações de atacar e defender adicionadas ao combate, com redução de dano na postura defensiva;
- cadastro e edição de classes no painel administrativo, com prioridade para definir quem ataca primeiro e modificadores percentuais de atributos;
- habilidades publicadas integradas ao motor de batalha por meio de snapshots, gatilhos, requisitos, escalas e duração de efeitos;
- passivas funcionais para dano, cura, buff, debuff, escudo, evasão, roubo de vida e substituição do ataque comum;
- nomes e descrições das habilidades vinculadas exibidos na coleção e durante a batalha;
- correção da recompensa final da Expedição no ledger, incluindo o motivo `EXPEDICAO_CONCLUIDA` na restrição do PostgreSQL;
- senha fortalecida com mínimo de oito caracteres, letra maiúscula, número e caractere especial;
- relatório de autenticação criado em `RELATORIO_TESTES_AUTENTICACAO.md`;
- correção dos motivos do ledger usados pelo gacha para respeitar as constraints do PostgreSQL;
- animação de invocação e revelação das cartas no gacha;
- retorno da compra do Stripe direcionado à loja, sem interferir na rota do gacha;
- reorganização do painel administrativo de usuários, com modal compacto, coleção pesquisável e confirmação antes de remover cartas;
- histórico financeiro administrativo limitado a 10 registros por página, com filtros e autoria explícita;
- mensagens administrativas movidas para notificações globais em vez de alertas fixos dentro do painel;
- scroll único e personalizado no modal de gerenciamento de usuários;
- avatar e resumo rápido do usuário exibidos no cabeçalho administrativo.
- editor administrativo de cartas e estilos do gerenciamento de usuários divididos em módulos menores, sem arquivos da aplicação acima de 1.000 linhas.

## Regras atuais de combate

- cada deck válido possui de 3 a 6 cartas únicas;
- a prioridade de ataque vem da classe da carta: o menor número age primeiro e o jogador vence empates;
- a classe pode modificar HP, ataque e defesa da carta antes do início da batalha;
- defender reduz o dano do ataque inimigo naquele turno;
- habilidades são automáticas e podem reagir à entrada em campo, ao ataque, ao recebimento de dano e ao início ou fim do turno;
- requisitos podem considerar HP atual, turno mínimo ou quantidade de ataques realizados;
- efeitos temporários e escudos expiram conforme a duração configurada;
- estado, efeitos e eventos são persistidos pelo backend, sem confiar em cálculos do navegador.

## Fluxo da Expedição

1. O jogador seleciona um deck válido e inicia uma jornada.
2. Uma trilha reproduzível é gerada por seed, com três etapas de rotas aleatórias.
3. Cada escolha inicia uma batalha com a dificuldade indicada pela rota.
4. Uma vitória libera a próxima etapa; uma derrota encerra a Expedição.
5. Após as três etapas, o jogador enfrenta o chefe final.
6. A primeira conclusão registra 100 Rubys no ledger e finaliza a jornada.

## Versionamento de trabalho

- `master`: base estável do projeto;
- `backup-pre-aprovacao`: cópia preservada do estado anterior às mudanças de progressão;
- `progresso`: desenvolvimento atual da Expedição, classes e habilidades de combate.

Alterações novas devem continuar em `progresso`. A branch de backup não deve receber mudanças comuns de desenvolvimento.

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
npm --prefix backend run test:e2e -- --runInBand
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend exec tsc -- --noEmit
npm --prefix frontend run build
npm --prefix backend audit --omit=dev
npm --prefix frontend audit --omit=dev
```

Os testes unitários cobrem o motor de batalha, prioridade das classes, decisões do turno, execução das habilidades, validação e simulação de efeitos, regras administrativas de cartas e classes, perfil, recompensas e partes do gacha. A suíte E2E de rotas críticas valida login e sessão, regras de senha, criação e validação de decks, início e turno de partida, checkout e corpo bruto do webhook Stripe, ranking e histórico. Esses testes HTTP usam services isolados para serem rápidos e não alterarem o banco ou criarem pagamentos reais.

## Regra econômica

Rubys são a única moeda do jogo. Eles podem ser recebidos em batalhas e recompensas ou adquiridos futuramente por pagamento. Todas as cartas devem continuar obtíveis jogando; compras devem economizar tempo, sem oferecer atributos ou cartas competitivas exclusivas.
