# Objetivos versus resultados alcançados

## Objetivo geral

O objetivo geral do projeto foi desenvolver uma plataforma web de RPG baseada em cartas colecionáveis, reunindo gerenciamento de conta, obtenção e organização de cartas, montagem de decks e confrontos por turnos em uma aplicação integrada. Esse objetivo foi alcançado por meio da implementação do AnimeCards, composto por uma interface em Next.js, uma API em NestJS e persistência relacional em PostgreSQL com Prisma.

## Comparação dos objetivos específicos

| Objetivo específico | Resultado alcançado | Situação |
| --- | --- | --- |
| Implementar cadastro e autenticação de usuários | Foram desenvolvidos cadastro, verificação de e-mail, login convencional, recuperação de senha e autenticação com Google. A sessão utiliza cookie `HttpOnly`, com revalidação do usuário no servidor. | Alcançado |
| Permitir o gerenciamento do perfil do jogador | O usuário pode alterar nome, senha, biografia, preferências, avatar, banner e moldura, além de solicitar exclusão ou desativação da conta. | Alcançado |
| Criar um sistema de cartas colecionáveis | A coleção apresenta somente as cartas pertencentes ao jogador, com filtros, detalhes, raridade, classe, elemento, atributos e habilidades. | Alcançado |
| Permitir a criação e organização de decks | O construtor permite criar, editar, excluir e equipar decks contendo de uma a seis cartas únicas. | Alcançado |
| Desenvolver um sistema de obtenção de cartas | O gacha possui invocação unitária e múltipla, custo em Rubys, giro gratuito, sistema de garantia, rotação de banner e tratamento de cartas duplicadas. | Alcançado |
| Implementar batalhas por turnos | O servidor controla a ordem dos turnos, atributos, dano, defesa, efeitos, habilidades e resultado. A interface identifica atacante e alvo, exibe dano recebido, animações e opção de avançar para o resultado. | Alcançado |
| Criar uma modalidade de progressão | A Expedição gera uma trilha procedural com escolhas, confrontos progressivos, chefe final, diálogo e recompensa registrada no ledger. | Alcançado |
| Implementar economia e recompensas | Rubys são controlados pelo backend e registrados em ledger. O sistema contempla recompensas, gacha, duplicatas, Expedição e compra de pacotes pelo Stripe em modo de teste. | Alcançado no escopo acadêmico |
| Disponibilizar ranking e histórico | O ranking apresenta apenas jogadores que já pontuaram, respeita preferências de privacidade e permite consultar o histórico paginado de partidas. | Alcançado |
| Criar ferramentas administrativas | O painel permite gerenciar usuários, cartas, classes, habilidades, notícias, saldos, coleções, campanha e configuração do chefe. | Alcançado |
| Garantir consistência e segurança das regras | Cálculos e operações econômicas permanecem no backend. Foram aplicados validação de DTOs, guards, rate limiting, Helmet, CSP, CORS restrito, validação real de imagens e cookie de sessão `HttpOnly`. | Alcançado |
| Validar o funcionamento da aplicação | Foram aprovados 117 testes unitários e 23 testes E2E. Também foram concluídos lint, verificação TypeScript, builds do frontend e backend e auditorias de dependências sem vulnerabilidades conhecidas. | Alcançado |

## Resultados adicionais

Além dos objetivos inicialmente associados ao núcleo do jogo, foram entregues recursos complementares: notícias públicas, correio e notificações, recompensa diária e semanal, personalização visual do perfil, integração com serviços de armazenamento de imagens, checkout pelo Stripe e diálogo do chefe com suporte a Gemini, OpenAI ou avaliação local.

## Limitações e trabalhos futuros

O projeto não contempla partidas PvP em tempo real, pagamento por Pix ou inteligência artificial avançada para o adversário durante os combates. O gerenciamento administrativo de banners e pacotes também pode ser ampliado com operações completas de criação, edição e exclusão. Esses itens não comprometem o objetivo geral do trabalho e são apresentados como possibilidades de evolução.

## Síntese

Os resultados demonstram que o objetivo geral e os objetivos específicos essenciais foram atingidos. A solução desenvolvida integra as principais etapas esperadas em um jogo de cartas — aquisição, coleção, montagem de deck, combate, progressão e recompensa — enquanto mantém as decisões críticas sob responsabilidade do servidor. Dessa forma, o protótipo deixou de ser apenas uma demonstração visual e passou a constituir um sistema funcional, persistente, testado e compatível com o escopo acadêmico definido para o TCC.
