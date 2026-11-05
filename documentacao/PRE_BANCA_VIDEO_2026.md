# Preparação do vídeo de pré-banca — AnimeCards

Baseado no roteiro recebido em 05/11/2026. Limite: 20 minutos. Os tempos abaixo são metas para um ensaio de 18 a 19 minutos, deixando margem para pausas.

## Antes de gravar

- Confirmar nome do curso, integrantes e orientador com o grupo. Todos os integrantes precisam falar.
- Preparar uma conta de jogador já verificada, com cartas e deck equipado, e uma conta de administrador. Não mostrar senhas, tokens, e-mails pessoais nem dados de pagamento na gravação.
- Abrir o site publicado e confirmar, no mesmo dia da gravação, login, coleção, deck, expedição, combate e painel administrativo. Deixar uma batalha pronta para a demonstração.
- Fazer uma passagem em desktop e outra em largura de celular. Aumentar o zoom do código e dos diagramas para ficarem legíveis no vídeo.
- Gravar um ensaio cronometrado. Se um serviço externo falhar, explicar a limitação e mostrar o fluxo comprovado em outro ambiente; não descrever uma simulação como integração validada.

## 1. Apresentação e contextualização — 0:00 a 2:30

**Na tela:** título do projeto e uma tela inicial do jogo.

**Fala sugerida:** “O AnimeCards é uma plataforma web de jogo de cartas com progressão de RPG. O problema que buscamos resolver é reunir coleção, formação de deck, combate e progresso do jogador em uma experiência única, com regras controladas pelo servidor. O público-alvo são jogadores de cartas digitais com temática de anime. Nosso objetivo foi criar uma base funcional e extensível, com área do jogador e administração do conteúdo.”

Apresentar curso, integrantes e orientador com os nomes reais. Não atribuir ao projeto uma pesquisa de usuários ou resultado de mercado que não tenha sido medido.

## 2. Arquitetura e tecnologias — 2:30 a 5:15

**Na tela:** `documentacao/diagramas/04-contexto.png`, `05-containers.png` e, se couber, `06-componentes-backend.png` ou o modelo relacional.

**Fala sugerida:** “O navegador executa o frontend Next.js. As ações seguem por HTTP para a API NestJS, que valida entrada, autenticação, permissões e regras de negócio. O Prisma persiste os dados no PostgreSQL. Cartas, saldo, dano e recompensas são decididos no backend; o navegador apresenta o resultado. O projeto separa módulos de autenticação, perfil, jogo e administração.”

Mostrar só os diagramas necessários para explicar o caminho de uma operação. Justificar Next.js pela interface, NestJS pela separação das regras e PostgreSQL/Prisma pela persistência relacional. Integrações externas entram apenas se forem citadas na demonstração.

## 3. Demonstração das funcionalidades — 5:15 a 11:15

**Roteiro de tela, com dados preparados:**

1. Entrar como jogador e mostrar a home, a coleção e um deck equipado.
2. Abrir uma expedição, escolher uma rota e iniciar o combate. Mostrar ao menos uma decisão de turno, o retorno do servidor e a progressão da batalha. Se a jornada completa for longa, deixar uma segunda expedição preparada para mostrar o chefe e o resultado.
3. Mostrar uma validação ou mensagem real da interface, sem provocar uma falha que comprometa a gravação.
4. Abrir rapidamente a largura de celular para mostrar a adaptação da interface.
5. Entrar no painel administrativo e mostrar uma carta, um banner ou campanha e a diferença de permissões em relação ao jogador.

O fluxo principal deve ser mostrado funcionando. Evitar gastar os seis minutos navegando por todas as telas. Pagamentos devem ser apresentados apenas como modo de teste se forem citados.

## 4. Implementação da solução — 11:15 a 16:00

**Na tela:** um diagrama e poucos arquivos, com fonte ampliada.

Percorrer uma operação concreta: escolha de rota na interface → requisição à API → autenticação e validação → `backend/src/modules/jogo/expedicao/expedicoes.service.ts` → `backend/src/modules/jogo/combate/partidas.service.ts` → gravação no PostgreSQL → resposta exibida ao jogador. Mostrar uma regra fácil de defender, como a quantidade progressiva de cartas inimigas em `expedicao/expedicao.trilha.ts` ou a recompensa calculada no servidor.

Apontar o esquema em `backend/prisma/schema.prisma`, os guards em `backend/src/common/guards/` e um teste de serviço em `backend/src/modules/jogo/`. Dizer quais testes foram efetivamente executados para a versão gravada; os números dos relatórios antigos são históricos e precisam ser revalidados antes de serem citados.

## 5. Fechamento — 16:00 a 18:30

Retomar o objetivo e relacioná-lo ao que foi mostrado: coleção, deck, batalha, progressão e administração integrados. Explicar limites com precisão: não há PvP em tempo real; serviços externos e pagamentos dependem de configuração e validação próprias; balanceamento pode evoluir com um catálogo maior. Citar como próximos passos a ampliação do conteúdo, mais testes completos de jornada e aperfeiçoamento do balanceamento. Agradecer e deixar o grupo disponível para perguntas.

## Perguntas prováveis da banca

| Pergunta | Resposta curta e defensável |
| --- | --- |
| Por que a regra da batalha fica no servidor? | Para que dano, sorteio, saldo e recompensa não dependam de valores enviados pelo navegador. |
| Como vocês separam jogador e admin? | Rotas protegidas, autenticação e verificação de permissão no backend, além das telas específicas. |
| O que acontece se a integração externa falhar? | O fluxo afetado deve mostrar erro ou usar a alternativa prevista; a demonstração precisa indicar qual cenário foi realmente validado. |
| O que ainda falta? | Mais conteúdo, balanceamento com dados representativos e validação das integrações externas no ambiente final. |

## Conferência final

- Vídeo com até 20 minutos, cinco partes e participação de todos.
- Áudio claro; interface, diagramas e código legíveis.
- Demonstração real cobrindo o objetivo descrito no relatório técnico.
- Afirmações alinhadas à versão gravada: implementado, parcial e planejado separados.
