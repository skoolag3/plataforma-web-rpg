# Relatório de Auditoria de Segurança da API

> **Remediação em 27/09/2026:** as recomendações API-01, API-02, API-05 e API-06 foram implementadas. A API agora usa rate limiting, Helmet, remoção de `X-Powered-By`, CORS por lista exata, cookie de sessão `HttpOnly` e validação da assinatura dos uploads. As auditorias de dependências do frontend e backend ficaram sem vulnerabilidades conhecidas após a atualização dos pacotes.

**Projeto:** AnimeCards (TCC)
**Data:** 15/09/2026
**Alvo autorizado:** `http://localhost:3001`
**Tipo:** avaliação acadêmica, pontual e não destrutiva
**Método:** inspeção de código (NestJS + Prisma) + 10 requisições HTTP controladas

## Resumo executivo

A API local foi analisada por inspeção do código-fonte e por uma bateria de requisições HTTP unitárias, seguindo a skill de auditoria disponível em `.opencode/skills/auditoria-api-seguranca`. Os controles centrais funcionaram: rotas autenticadas e administrativas recusaram acesso anônimo e com token inválido (`401`), a validação global rejeitou propriedades não declaradas (`400`), o CORS liberou apenas a origem autorizada e não liberou uma origem arbitrária, e as respostas de recuperação/reenvio são genéricas, sem confirmar existência de conta.

Não foi confirmada nenhuma vulnerabilidade crítica ou alta nesta execução. Os principais pontos de melhoria são os mesmos já listados no README do projeto: ausência de limitação de requisições nas rotas públicas de autenticação, ausência de cabeçalhos HTTP de endurecimento (exposição de `X-Powered-By: Express`), e o uso do `localStorage` no frontend para guardar o token JWT (fora do escopo HTTP direto desta auditoria, mas relevante para produção).

## Escopo, autorização e limites

- Sistema avaliado: API do próprio projeto de TCC, em desenvolvimento local.
- Ambiente alvo: `http://localhost:3001` (NestJS 11, Express, Prisma 7 + PostgreSQL).
- Áreas verificadas: autenticação, autorização administrativa, DTOs e validação, CORS, cabeçalhos HTTP, tratamento de erros, uploads e webhook Stripe.
- Autorização: o alvo é o servidor local do repositório aberto no ambiente de trabalho, atendendo ao requisito da skill de usar apenas `localhost`/ambiente de desenvolvimento.
- Foram usadas somente requisições unitárias com dados fictícios; nada foi gravado no banco, excluído, alterado ou enviado.
- Não foram realizados força bruta, negação de serviço, varredura massiva, upload real, exploração de injeção, nem tentativa de obter privilégios.
- Não foi usado usuário autenticado comum nem administrador; portanto, autorização horizontal, IDOR e segregação de perfis não foram testados dinamicamente (apenas por inspeção de código).

## Metodologia e limites

1. Leitura dos controllers, guards, DTOs, estratégia JWT, filtro global de exceções, configuração do `main.ts` e dependências (`package.json`).
2. Inventário das rotas públicas, autenticadas e administrativas.
3. Execução do script seguro da skill:
   `node .opencode/skills/auditoria-api-seguranca/scripts/auditar-api.mjs http://localhost:3001`
4. Testes complementares com `curl` para confirmar CORS com origem autorizada e não autorizada, reenvio/recuperação genéricos e rejeição de campos não declarados.
5. Classificação dos achados em `Confirmado`, `Indício` ou `Não testado`.

Limites da metodologia: a avaliação foi estática + dinâmica pontual, sem varredura de dependências (CVE), sem teste de concorrência ou desempenho, sem Stripe real, sem enviar arquivos e sem duas contas autenticadas. A ausência de exploração destrutiva foi intencional e segue a skill.

## Inventário resumido

- **Públicas:** `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-email`, `POST /auth/reenviar-verificacao`, `POST /auth/solicitar-redefinicao-senha`, `POST /auth/redefinir-senha`, `GET /noticias`, `GET /noticias/:id`, vitrine/jogo público, lista de pacotes da loja e `POST /loja/stripe/webhook`.
- **Autenticadas:** `/auth/me`, `/perfil/*` (inclusive avatar/banner), `/jogo/*` (coleção, decks, partidas, gacha, correio, recompensas, expedição), `/loja/checkout/:id`, `GET /perfil/google/url` e callback OAuth.
- **Administrativas (Jwt + Admin):** `/admin/dashboard`, `/admin/usuarios/*`, `/admin/cartas/*`, `/admin/habilidades/*`, `/admin/classes/*`, `/admin/banners/*`, `/admin/noticias/*`, `/admin/uploads/*`.

## Controles positivos observados

- `GET /auth/me` sem token e com token inválido retornou `401`.
- `GET /admin/dashboard` sem token retornou `401`; os controllers administrativos usam `JwtAuthGuard` + `AdminGuard`.
- A autorização administrativa não confia no payload do token: a `JwtStrategy` atualiza `isAdmin` a partir do banco e revalida `ativo`, `bloqueado`, `email_verificado` e `excluido_em` a cada requisição (`jwt.strategy.ts`).
- `JWT_SECRET` é obrigatório fora do ambiente de teste (`jwt.config.ts`).
- O `ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted`; o corpo `{"admin": true}` no login foi rejeitado com `property admin should not exist`.
- Senha com bcrypt (custo 10) e política de 8 a 72 caracteres com maiúscula, minúscula, número e símbolo no cadastro e na redefinição.
- Bloqueio da conta após 5 tentativas inválidas de login, com revalidação do bloqueio a cada requisição autenticada.
- Mensagens genéricas em login, reenvio de verificação e solicitação de redefinição, sem vazar existência de conta (testado com e-mail fictício).
- CORS: preflight de `http://localhost:3000` recebeu `Access-Control-Allow-Origin`; preflight e requisição de origem arbitrária (`https://evil.example.com`) não receberam o cabeçalho.
- O filtro global de exceções esconde stack traces em falhas de `500` (resposta genérica `Erro interno no servidor.`).
- Webhook Stripe valida assinatura (`constructEvent` com `rawBody`) e é idempotente pelo status da transação; `checkout.sessions.create` usa preço vindo do banco, não do cliente.

## Achados

| ID | Severidade | Situação | Achado | Evidência | Recomendação |
|---|---|---|---|---|---|
| API-01 | Média | Indício | Não há limitação de requisições nas rotas públicas de autenticação e recuperação. | Nenhuma dependência de throttling (`@nestjs/throttler`, `express-rate-limit`) nem configuração encontrada no `package.json` e no `main.ts`; rotas de login, cadastro, reenvio e recuperação não declaram limite. Não foi gerada carga para confirmar dinamicamente. | Aplicar rate limiting por IP e por conta (janela + bloqueio progressivo) com resposta `429`, priorizando `POST /auth/login`, `register`, `reenviar-verificacao`, `verify-email`, `solicitar-redefinicao-senha` e `redefinir-senha`. |
| API-02 | Baixa | Confirmado | Respostas não têm cabeçalhos comuns de endurecimento e revelam `X-Powered-By: Express`. | Todas as respostas avaliadas enviaram `X-Powered-By: Express` e nenhuma apresentou `Content-Security-Policy`, `X-Frame-Options` ou `X-Content-Type-Options`. | Aplicar `helmet` no NestJS, desabilitar o `x-powered-by` e definir uma CSP compatível com Cloudinary/Supabase; revalidar após deploy. |
| API-03 | Baixa | Confirmado | O campo `error` das respostas expõe o nome da classe interna da exceção (`UnauthorizedException`, `BadRequestException`), e rotas inexistentes devolvem a mensagem padrão do Express. | `GET /auth/me` retornou `"error":"UnauthorizedException"`; `POST /auth/login` vazio retornou `"error":"BadRequestException"`; rota inexistente retornou `"error":"Not Found","message":"Cannot GET /auditoria-rota-inexistente"`. | Padronizar o campo `error` com rótulos neutros e tratar o `404` com mensagem própria, evitando detalhes do framework. |
| API-04 | Informativa | Confirmado | Inconsistência de mensagens e de política de senha mínima no DTO de login. | `POST /auth/login` com corpo vazio devolveu `senha must be longer than or equal to 6 characters` (mensagem em inglês do class-validator); o `LoginDto` usa `MinLength(6)`, enquanto cadastro e redefinição exigem 8+. | Padronizar mensagens em português e alinhar o `LoginDto` a 8+ caracteres para coerência, entendendo que a força real da senha é garantida no cadastro e na redefinição. |
| API-05 | Baixa | Indício | Uploads validam apenas o `mimetype` informado pelo cliente, sem conferência de assinatura/conteúdo. | `admin-uploads.controller.ts` e `perfil.controller.ts` restringem por `mimetype` e tamanho; não há `file-type`/assinatura de conteúdo. Não foi enviado arquivo real pelo respeito ao limite da skill. | Validar o conteúdo por assinatura (magic bytes), não confiar no `Content-Type`, e manter limites de tamanho já existentes. |
| API-06 | Informativa | Indício | O CORS libera qualquer `*.ngrok-free.app` e `*.ngrok.app` por regex. | `main.ts` aceita origens que casem com os padrões de ngrok, além das listadas em `FRONTEND_URLS`. Clareza do risco depende do ambiente de produção. | Conferir as origens definitivas em produção e remover o wildcard de ngrok se não houver túneis em uso. |

## Evidências dinâmicas resumidas

| Teste | Resultado esperado | Resultado observado |
|---|---:|---:|
| `GET /auditoria-rota-inexistente` | 404 sem stack trace | 404 com mensagem do Express (`Cannot GET`) |
| `GET /auth/me` sem token | 401 | 401 |
| `GET /auth/me` com token inválido | 401 | 401 |
| `GET /admin/dashboard` sem token | 401 | 401 |
| `POST /auth/login` sem corpo | 400 com validação | 400 com detalhes por campo |
| `POST /auth/login` (conta fictícia) | 401 genérico | 401 `Credenciais inválidas.` |
| `POST /auth/login` com campo `admin` extra | 400 rejeitando campo extra | 400 `property admin should not exist` |
| `POST /auth/reenviar-verificacao` (e-mail inexistente) | Resposta genérica | 201 `Se o e-mail existir, enviaremos uma nova verificação.` |
| `POST /auth/solicitar-redefinicao-senha` (e-mail inexistente) | Resposta genérica | 201 `Se o e-mail existir, enviaremos um link para alterar a senha.` |
| Preflight OPTIONS com origem `http://localhost:3000` | CORS liberado | 204 com `Access-Control-Allow-Origin: http://localhost:3000` |
| `GET /auth/me` com origem `https://evil.example.com` | Sem liberação | Sem `Access-Control-Allow-Origin` |

Achados confirmados apenas por inspeção estática (sem carga nem exploração): API-05 e API-06.

## Recomendações priorizadas

1. Implementar rate limiting nas rotas sensíveis de autenticação (API-01), incluindo limite por IP e por conta.
2. Aplicar `helmet`, remover `X-Powered-By` e definir CSP (API-02).
3. Esconder detalhes internos no campo `error` e tratar o `404` com mensagem própria (API-03).
4. Em etapa futura autorizada, testar com duas contas de teste (comum e administrador): acesso horizontal, IDOR e segregação de papéis, além de teste do webhook Stripe com assinaturas válida e inválida.
5. Validar uploads por assinatura de conteúdo antes de produção (API-05) e revisar as origens CORS definitivas (API-06).

## Limitações

Esta avaliação não cobriu varredura de CVEs de dependências, infraestrutura (Vercel/Render/Supabase/Cloudinary), cookies/CSRF no navegador, upload real, fluxo completo do Stripe, concorrência do gacha, desempenho, nem autorização horizontal com duas contas autenticadas. A política de token em `localStorage` e a migração para cookie `HttpOnly` são pontos fora do HTTP direto e devem ser tratados antes de produção. Ausência de prova de falha não implica ausência de falha.

## Conclusão

A API local demonstrou controles básicos sólidos: bloqueio de acesso anônimo, flag de campo extra rejeitado na validação, mensagens genéricas contra enumeração de contas e CORS restrito à origem autorizada. As lacunas mais relevantes são o rate limiting nas rotas de autenticação e a aplicação de cabeçalhos de endurecimento, seguidas de melhorias cosméticas de tratamento de erros e validação de uploads. Esta avaliação é pontual e não garante a ausência de outras vulnerabilidades.
