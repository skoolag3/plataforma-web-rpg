# Relatório de Auditoria de Segurança da API

**Projeto:** AnimeCards  
**Data:** 10/09/2026  
**Alvo autorizado:** `http://localhost:3001`  
**Tipo:** avaliação acadêmica, pontual e não destrutiva

## Resumo executivo

A API local foi analisada por inspeção do código NestJS e por 7 requisições HTTP controladas. Os bloqueios de autenticação e administração responderam corretamente, a validação global rejeitou entrada inválida e o CORS recusou uma origem externa. Não foi encontrado acesso não autenticado às rotas protegidas avaliadas.

Foram encontrados dois pontos de melhoria: ausência aparente de limitação de requisições nas rotas de autenticação e ausência de cabeçalhos HTTP de endurecimento, além da exposição do identificador `Express`. Nenhuma vulnerabilidade crítica ou alta foi confirmada nesta execução.

## Escopo, autorização e limites

- Sistema avaliado: API do próprio projeto de TCC.
- Ambiente: desenvolvimento local, porta 3001.
- Áreas verificadas: autenticação, autorização administrativa, DTOs, CORS, cabeçalhos e tratamento de erros.
- Foram usadas somente requisições unitárias e dados fictícios.
- Não foram realizados força bruta, negação de serviço, exclusão, upload, alteração de dados, exploração de injeção ou tentativa de obter privilégios.
- Não foi usado usuário autenticado comum nem administrador; portanto, autorização horizontal e separação entre perfis não foram testadas dinamicamente.

## Metodologia

1. Leitura dos controllers, guards, DTOs, configuração inicial e filtro global de exceções.
2. Inventário resumido das rotas públicas, autenticadas e administrativas.
3. Execução do script seguro da skill com requisições sequenciais.
4. Comparação dos resultados HTTP com os controles encontrados no código.
5. Classificação dos achados como confirmado, indício ou não testado.

Comando executado:

```powershell
node .opencode/skills/auditoria-api-seguranca/scripts/auditar-api.mjs http://localhost:3001
```

## Inventário resumido

- Públicas: cadastro, login, verificação de e-mail, recuperação de senha, notícias e vitrine.
- Autenticadas: perfil, coleção, decks, partidas, gacha, correio, recompensas e expedição.
- Administrativas: dashboard, usuários, cartas, habilidades, classes, banners, notícias e uploads.
- Pagamentos: pacotes, criação de checkout e webhook Stripe.

## Controles positivos observados

- `GET /auth/me` sem token e com token inválido retornou `401`.
- `GET /admin/dashboard` sem token retornou `401`.
- O painel administrativo usa `JwtAuthGuard` e `AdminGuard` no backend.
- O `ValidationPipe` global usa lista permitida e rejeita propriedades não declaradas.
- Cadastro e redefinição exigem senha de 8 a 72 caracteres, maiúscula, minúscula, número e símbolo.
- Uma origem CORS externa não recebeu `Access-Control-Allow-Origin`; a origem local autorizada recebeu permissão.
- Erros internos não devolvem stack trace; o filtro responde com mensagem genérica para falhas inesperadas.
- Login de usuário fictício respondeu apenas `Credenciais inválidas.`, sem confirmar existência da conta.

## Achados

| ID | Severidade | Situação | Achado | Evidência | Recomendação |
|---|---|---|---|---|---|
| API-01 | Média | Indício | Não foi localizada limitação de requisições para login, recuperação e reenvio de e-mail. | Não há configuração de throttling no bootstrap, módulos ou dependências pesquisadas. Não foi produzida carga para confirmar dinamicamente. | Adicionar limite por IP e por conta, com janela, bloqueio progressivo e resposta `429`; proteger especialmente `/auth/login` e recuperação de senha. |
| API-02 | Baixa | Confirmado | Respostas não possuem cabeçalhos comuns de endurecimento e revelam `X-Powered-By: Express`. | As respostas avaliadas não apresentaram CSP, `X-Frame-Options` nem `X-Content-Type-Options`, e enviaram `X-Powered-By: Express`. | Configurar `helmet` no NestJS e desabilitar `x-powered-by`; revisar CSP conforme o frontend e os uploads. |
| API-03 | Informativa | Confirmado | A mensagem de validação do login mistura português com mensagens padrão em inglês e permite senha mínima de 6 no DTO de login. | `POST /auth/login` com `{}` retornou textos `must be...`; `LoginDto` usa `MinLength(6)`, enquanto criação e redefinição exigem 8. | Padronizar mensagens em português. Opcionalmente alinhar o DTO de login a 8 para consistência, entendendo que a força real deve ser garantida no cadastro e na redefinição. |

## Evidências dinâmicas resumidas

| Teste | Resultado esperado | Resultado observado |
|---|---:|---:|
| Rota inexistente | 404 sem stack trace | 404, mensagem controlada |
| Perfil sem token | 401 | 401 |
| Perfil com token inválido | 401 | 401 |
| Dashboard admin sem token | 401 | 401 |
| Login sem campos | 400 com validação | 400 com detalhes por campo |
| Login de conta fictícia | 401 genérico | 401, `Credenciais inválidas.` |
| Preflight de origem externa | Sem liberação da origem | Sem `Access-Control-Allow-Origin` |

## Recomendações priorizadas

1. Implementar rate limiting nas rotas sensíveis de autenticação.
2. Adicionar `helmet`, remover `X-Powered-By` e conferir os cabeçalhos após a mudança.
3. Executar uma segunda etapa com duas contas de teste: usuário comum e administrador, verificando acesso horizontal, segregação de funções e IDs de recursos conhecidos.
4. Testar o webhook Stripe com assinatura válida e inválida no ambiente sandbox.
5. Automatizar esta bateria no pipeline, mantendo o alvo padrão restrito a `localhost`.

## Limitações

A execução não avaliou dependências com scanner de CVEs, infraestrutura do Render/Vercel, banco Supabase, cookies no navegador, upload real, Stripe completo, concorrência, desempenho ou autorização entre duas contas autenticadas. A ausência de exploração destrutiva foi intencional.

## Conclusão

Os controles básicos avaliados funcionaram: rotas protegidas recusaram acesso anônimo, a entrada inválida foi filtrada e o CORS não liberou uma origem arbitrária. O principal próximo passo de segurança é limitar tentativas nas rotas de autenticação e aplicar cabeçalhos de endurecimento. Esta avaliação representa uma amostra pontual e não garante a ausência de outras vulnerabilidades.
