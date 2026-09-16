---
name: auditoria-api-seguranca
description: Avalia APIs próprias ou explicitamente autorizadas com reconhecimento de rotas, testes HTTP não destrutivos de autenticação, autorização, validação, CORS, cabeçalhos e tratamento de erros, gerando um relatório Markdown com evidências e recomendações. Use para auditoria acadêmica, revisão de segurança ou pentest controlado; não use contra sistemas sem autorização.
metadata:
  audience: estudantes-e-desenvolvedores
  safety: testes-nao-destrutivos
---

# Auditoria de segurança de API

Avalie somente a API informada pelo usuário ou a API local do projeto aberto. O objetivo é navegar pela superfície da API e encontrar falhas demonstráveis sem prejudicar dados, disponibilidade ou usuários.

## Limites obrigatórios

- Confirme pelo contexto que o sistema pertence ao usuário ou que há autorização explícita.
- Prefira `localhost` e ambientes de desenvolvimento. Para um endereço remoto, exija autorização explícita no pedido.
- Não faça força bruta, negação de serviço, varredura massiva, persistência, upload malicioso, exclusão, alteração de privilégios ou exploração destrutiva.
- Não tente adivinhar credenciais, tokens ou identificadores em volume.
- Use no máximo 50 requisições, uma por vez. Interrompa em caso de instabilidade, vários erros 5xx ou sinais de impacto.
- Use apenas contas e tokens de teste fornecidos ou criados de modo autorizado. Nunca grave segredos no relatório.
- Em rotas que alteram estado, limite-se à análise estática ou use dados descartáveis com autorização clara.

## Procedimento

1. Identifique a URL base, o framework e o ambiente. Se o projeto indicar NestJS local na porta 3001, use `http://localhost:3001`.
2. Leia controllers, guards, DTOs, filtros de exceção e configuração de CORS antes de enviar requisições.
3. Inventarie rotas públicas, autenticadas e administrativas. Separe fatos observados de hipóteses.
4. Execute `node .opencode/skills/auditoria-api-seguranca/scripts/auditar-api.mjs <URL_BASE>` para a verificação dinâmica inicial.
5. Analise autenticação, autorização, validação, consistência dos erros de login, CORS, cabeçalhos, exposição de detalhes internos e presença de limitação de requisições.
6. Não declare uma vulnerabilidade apenas por suspeita do código. Classifique como `Confirmado`, `Indício` ou `Não testado`.
7. Gere `RELATORIO_AUDITORIA_API.md` na raiz do projeto.

## Estrutura obrigatória do relatório

Inclua: resumo executivo, escopo e autorização, ambiente, metodologia e limites, inventário resumido, controles positivos, achados, evidências, recomendações priorizadas, limitações e conclusão.

Na tabela de achados use as colunas `ID`, `Severidade`, `Situação`, `Achado`, `Evidência` e `Recomendação`. Registre comandos reproduzíveis sem cookies, senhas ou tokens reais.

Finalize deixando claro que a avaliação é pontual e não garante ausência de vulnerabilidades.
