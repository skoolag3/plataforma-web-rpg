ALTER TABLE "configuracao_campanha"
  ADD COLUMN "boss_nome" VARCHAR(100) NOT NULL DEFAULT 'Guardião da Expedição',
  ADD COLUMN "boss_personalidade" VARCHAR(600) NOT NULL DEFAULT 'Orgulhoso, estratégico e provocador, mas respeita a coragem.',
  ADD COLUMN "boss_provocacao" VARCHAR(500) NOT NULL DEFAULT 'Você atravessou minha trilha. Agora prove que merece sair dela.',
  ADD COLUMN "boss_perguntas" TEXT[] NOT NULL DEFAULT ARRAY[
    'Por que você merece atravessar meu domínio?',
    'O que faria se sua carta mais forte caísse agora?',
    'Qual sacrifício aceitaria para vencer esta batalha?',
    'O que distingue coragem de imprudência?'
  ],
  ADD COLUMN "boss_cartas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "expedicao" ADD COLUMN "dialogo_boss" JSONB;
