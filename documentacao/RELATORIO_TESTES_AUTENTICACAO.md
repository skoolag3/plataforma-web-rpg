# Relatório de Testes Automatizados — Autenticação

**Projeto:** AnimeCards  
**Data da execução:** 02/09/2026  
**Tecnologias:** NestJS, TypeScript, Jest, Supertest e class-validator

## 1. Objetivo

Analisar o projeto, identificar a implementação responsável pela autenticação e produzir testes automatizados para as regras de senha solicitadas:

- mínimo de 8 caracteres;
- pelo menos uma letra maiúscula;
- pelo menos um número;
- pelo menos um caractere especial.

## 2. Identificação da autenticação

A autenticação foi encontrada e compreendida.

O endpoint `POST /auth/login` é definido em `backend/src/modules/auth/controllers/auth.controller.ts`. O método `AuthService.login`, localizado em `backend/src/modules/auth/services/auth.service.ts`, é responsável por:

1. normalizar e validar o e-mail;
2. localizar o usuário no banco de dados;
3. verificar se a conta está ativa, verificada ou bloqueada;
4. comparar a senha informada com o hash armazenado usando bcrypt;
5. controlar tentativas inválidas e bloqueio da conta;
6. gerar o token JWT quando as credenciais estão corretas.

As regras de senha nova são centralizadas em `backend/src/common/validation/senha.validation.ts` e aplicadas ao cadastro, à redefinição e à alteração de senha por meio dos DTOs do NestJS.

## 3. Divergência encontrada

Durante a análise, o projeto exigia inicialmente 12 caracteres, enquanto o requisito da atividade determina o mínimo de 8. A constante, a expressão regular, a mensagem de validação e o indicador visual do frontend foram alinhados para 8 caracteres.

A aplicação continua exigindo também uma letra minúscula. Essa regra já fazia parte da política de segurança do projeto e foi preservada, pois não entra em conflito com os requisitos da atividade.

## 4. Testes criados

### Testes unitários da política de senha

Arquivo: `backend/src/common/validation/senha.validation.spec.ts`

| Caso | Entrada | Resultado esperado |
|---|---|---|
| Senha válida no limite mínimo | `Abcde1#x` | Aceita |
| Menos de 8 caracteres | `Abcd1#x` | Rejeitada |
| Sem letra maiúscula | `abcdef1#` | Rejeitada |
| Sem letra minúscula | `ABCDEF1#` | Rejeitada |
| Sem número | `Abcdefg#` | Rejeitada |
| Sem caractere especial | `Abcdefg1` | Rejeitada |
| Acima do limite máximo | senha com mais de 72 caracteres | Rejeitada |

### Testes de integração da rota HTTP

Arquivo: `backend/test/rotas-criticas/auth.e2e-spec.ts`

Os testes enviam requisições reais ao controller usando Supertest e confirmam que o `ValidationPipe`:

- permite o cadastro com uma senha válida de 8 caracteres;
- bloqueia senhas curtas;
- bloqueia senhas sem letra maiúscula;
- bloqueia senhas sem número;
- bloqueia senhas sem caractere especial;
- não chama o serviço de cadastro quando os dados são inválidos.

Os testes existentes de login válido, login inválido e proteção da rota de perfil também foram mantidos.

## 5. Execução

Comandos utilizados:

```bash
cd backend
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Resultados obtidos:

| Suíte | Resultado |
|---|---|
| Testes unitários completos | 15 suítes aprovadas, 93 testes aprovados |
| Testes E2E completos | 7 suítes aprovadas, 22 testes aprovados |
| Teste unitário específico de senha | 1 suíte aprovada, 7 testes aprovados |
| Teste E2E específico de autenticação | 1 suíte aprovada, 8 testes aprovados |

Durante a primeira execução E2E, o suporte compartilhado de testes não possuía mocks para serviços adicionados recentemente ao módulo de jogo. O suporte foi atualizado com os serviços de recompensas, correio e expedições. Após a correção, todas as suítes foram executadas com sucesso.

## 6. Conclusão

A função responsável pela autenticação foi identificada e compreendida. As regras de senha solicitadas foram implementadas e verificadas em duas camadas: validação unitária e integração HTTP. Todos os testes automatizados executados foram aprovados, demonstrando que o sistema aceita senhas que cumprem os requisitos e rejeita as combinações inválidas antes de executar o cadastro.
