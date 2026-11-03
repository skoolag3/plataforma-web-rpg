# Deploy gratuito na Vercel e no Supabase

O projeto usa dois projetos gratuitos na Vercel, ambos configurados para a região de São Paulo (`gru1`):

- `frontend/`: aplicação Next.js;
- `backend/`: API NestJS executada como uma Vercel Function;
- PostgreSQL: Supabase;
- imagens: Cloudinary.

Os arquivos `frontend/vercel.json` e `backend/vercel.json` já ativam Fluid Compute e fixam a execução em São Paulo. Nunca envie arquivos `.env` para o Git.

## 1. Preparar o Supabase

1. Crie ou abra o projeto do Supabase.
2. Em **Connect**, copie a URL do **Session Pooler**.
3. Mantenha `sslmode=require` na URL.
4. Use a URL do pooler em `DATABASE_URL` na Vercel.
5. Use a conexão indicada pelo Supabase para migrations em `DIRECT_DATABASE_URL`.

Antes do primeiro deploy, aplique as migrations em um ambiente seguro:

```powershell
cd backend
$env:DIRECT_DATABASE_URL="postgresql://..."
npm.cmd run prisma:deploy
```

## 2. Publicar o backend

1. Na Vercel, importe o repositório.
2. Defina **Root Directory** como `backend`.
3. Não informe framework, build command ou output directory manualmente. A Vercel detecta `src/main.ts` como NestJS.
4. Cadastre as variáveis de produção:
   - `DATABASE_URL` e `DIRECT_DATABASE_URL`;
   - `JWT_SECRET` com um valor aleatório e longo;
   - `NODE_ENV=production`;
   - `FRONTEND_URL` e `FRONTEND_URLS` com a URL definitiva do frontend;
   - variáveis `SUPABASE_*`, `CLOUDINARY_*`, `GOOGLE_*`, `STRIPE_*` e `SMTP_*` usadas pelo ambiente.
5. Faça o deploy e copie o domínio da API, por exemplo `https://animecards-api.vercel.app`.

O script `postinstall` gera o Prisma Client durante a instalação. A API inteira é publicada como uma única Vercel Function com Fluid Compute.

## 3. Publicar o frontend

1. Importe novamente o mesmo repositório como outro projeto.
2. Defina **Root Directory** como `frontend`.
3. Cadastre em Production, Preview e Development:

```text
BACKEND_URL=https://animecards-api.vercel.app
NEXT_PUBLIC_API_URL=/api
```

4. Faça o deploy e copie a URL final do frontend.
5. Volte ao projeto do backend e atualize:

```text
FRONTEND_URL=https://animecards.vercel.app
FRONTEND_URLS=https://animecards.vercel.app
```

6. Refaça o deploy do backend para aplicar as URLs.

O frontend encaminha `/api/*` para o backend. Assim, autenticação e cookies continuam usando o domínio público do site.

## 4. Ajustar integrações externas

- Google OAuth: `GOOGLE_CALLBACK_URL=https://animecards.vercel.app/api/perfil/google/callback` e a mesma URL exata no Google Cloud;
- Stripe: webhook `https://animecards.vercel.app/api/loja/stripe/webhook`;
- Supabase Storage e Cloudinary: manter os buckets, pastas e credenciais existentes.

## 5. Verificação final

- confirmar que frontend e backend indicam a região `gru1`;
- abrir a landing page;
- criar conta, verificar e-mail e entrar;
- abrir coleção, decks, gacha e partida;
- testar upload de perfil e imagens administrativas;
- confirmar que `/admin` exige autenticação administrativa;
- verificar o cookie `animecards_session` como `HttpOnly` e `Secure`;
- completar um login real pelo Google;
- validar o webhook do Stripe no domínio definitivo;
- acompanhar Functions e Runtime Logs no painel da Vercel.

O plano Hobby é destinado a projeto pessoal e possui limites mensais. Se um limite for atingido, a Vercel pode interromper novas execuções até a renovação da franquia.
