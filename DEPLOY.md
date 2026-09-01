# Deploy gratuito: Vercel, Render e Supabase

O projeto deve ser publicado como três serviços:

- `frontend/`: Vercel;
- `backend/`: Render;
- PostgreSQL: Supabase.

As imagens continuam no Cloudinary. Nunca envie os arquivos `.env` para o Git.

## 1. Preparar o Supabase

1. Crie um projeto no Supabase.
2. Abra **Connect** e copie as duas URLs do PostgreSQL:
   - conexão pelo pooler para `DATABASE_URL`;
   - conexão direta para `DIRECT_DATABASE_URL`.
3. Mantenha `sslmode=require` nas URLs fornecidas pelo Supabase.

O backend usa `DATABASE_URL` durante a aplicação e `DIRECT_DATABASE_URL` para executar as migrations.

## 2. Publicar o backend no Render

1. Envie o repositório para o GitHub.
2. No Render, escolha **New > Blueprint** e selecione o repositório.
3. O arquivo `render.yaml` criará o serviço `animecards-api` usando a pasta `backend`.
4. Preencha as variáveis solicitadas:
   - `DATABASE_URL`;
   - `DIRECT_DATABASE_URL`;
   - `FRONTEND_URL`: inicialmente pode ficar com a futura URL da Vercel;
   - `FRONTEND_URLS`: mesma URL; use vírgulas para autorizar mais de uma.
5. Adicione manualmente as integrações utilizadas pelo ambiente:
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL` e `CLOUDINARY_ASSET_FOLDER`;
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`;
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_CALLBACK_URL`, se usar Google;
   - `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`, se testar pagamentos;
   - variáveis `SMTP_*` e `MAIL_FROM`, se o provedor/ambiente permitir SMTP.

O build gera o Prisma Client, aplica `prisma migrate deploy` e compila o NestJS. Depois do deploy, confirme:

```text
https://animecards-api.onrender.com/
```

A resposta esperada é `Hello World!`. O subdomínio exato pode ser diferente se o nome já estiver ocupado.

> O Render gratuito pode suspender o serviço quando ele fica sem acessos. O primeiro carregamento após a suspensão será mais lento. O plano gratuito também pode bloquear SMTP tradicional; nesse caso, o envio de e-mails precisará usar uma API HTTP.

## 3. Publicar o frontend na Vercel

1. Na Vercel, importe o mesmo repositório.
2. Em **Root Directory**, selecione `frontend`.
3. O framework detectado deve ser **Next.js**.
4. Cadastre estas variáveis em Production, Preview e Development:

```text
BACKEND_URL=https://animecards-api.onrender.com
NEXT_PUBLIC_API_URL=/api
```

5. Faça o deploy e copie a URL final, por exemplo:

```text
https://animecards.vercel.app
```

6. Volte ao Render e ajuste:

```text
FRONTEND_URL=https://animecards.vercel.app
FRONTEND_URLS=https://animecards.vercel.app
```

Se quiser autorizar uma URL de preview específica, acrescente-a em `FRONTEND_URLS`, separada por vírgula.

## 4. Ajustar integrações externas

- Google OAuth: `GOOGLE_CALLBACK_URL=https://animecards-api.onrender.com/perfil/google/callback`;
- Stripe: webhook `https://animecards-api.onrender.com/loja/stripe/webhook`;
- Supabase Storage: mantenha o bucket e as políticas já usados pelo perfil;
- Cloudinary: nenhuma alteração de URL é necessária.

## 5. Verificação final

- abrir a landing page da Vercel;
- criar conta, verificar e-mail e entrar;
- abrir coleção, decks, gacha e partida;
- conferir upload de perfil e imagens administrativas;
- confirmar que `/admin` continua exigindo autenticação administrativa;
- observar os logs do Render durante a primeira requisição.
