CREATE TABLE "produto_expedicao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(300) NOT NULL,
    "tema" VARCHAR(40) NOT NULL DEFAULT 'ARCANO',
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'RECORRENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "peso" INTEGER NOT NULL DEFAULT 100,
    "inicio_em" TIMESTAMPTZ(0),
    "fim_em" TIMESTAMPTZ(0),
    "recompensa_facil" INTEGER NOT NULL DEFAULT 25,
    "recompensa_media" INTEGER NOT NULL DEFAULT 25,
    "recompensa_dificil" INTEGER NOT NULL DEFAULT 25,
    "recompensa_chefe" INTEGER NOT NULL DEFAULT 100,
    "percentual_mantido_derrota" INTEGER NOT NULL DEFAULT 70,
    "boss_nome" VARCHAR(100) NOT NULL DEFAULT 'Guardião da Expedição',
    "boss_personalidade" VARCHAR(600) NOT NULL DEFAULT 'Orgulhoso, estratégico e provocador, mas respeita a coragem.',
    "boss_provocacao" VARCHAR(500) NOT NULL DEFAULT 'Você atravessou minha trilha. Agora prove que merece sair dela.',
    "boss_perguntas" TEXT[] DEFAULT ARRAY['Por que você merece atravessar meu domínio?', 'O que faria se sua carta mais forte caísse agora?', 'Qual sacrifício aceitaria para vencer esta batalha?', 'O que distingue coragem de imprudência?'],
    "boss_cartas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "produto_expedicao_pkey" PRIMARY KEY ("id")
);

INSERT INTO "produto_expedicao" (
    "nome", "descricao", "tema", "tipo", "ativo", "peso",
    "recompensa_facil", "recompensa_media", "recompensa_dificil",
    "recompensa_chefe", "percentual_mantido_derrota", "boss_nome",
    "boss_personalidade", "boss_provocacao", "boss_perguntas", "boss_cartas"
)
SELECT 'Expedição Arcana', 'A trilha recorrente principal da campanha.', 'ARCANO', 'RECORRENTE',
       "ativa", 100, "recompensa_facil", "recompensa_media", "recompensa_dificil",
       "recompensa_chefe", "percentual_mantido_derrota", "boss_nome",
       "boss_personalidade", "boss_provocacao", "boss_perguntas", "boss_cartas"
FROM "configuracao_campanha" WHERE "id" = 1;

ALTER TABLE "expedicao" ADD COLUMN "id_produto_expedicao" UUID;
CREATE INDEX "produto_expedicao_ativo_inicio_em_fim_em_idx" ON "produto_expedicao"("ativo", "inicio_em", "fim_em");
CREATE INDEX "expedicao_id_produto_expedicao_idx" ON "expedicao"("id_produto_expedicao");
ALTER TABLE "expedicao" ADD CONSTRAINT "expedicao_id_produto_expedicao_fkey" FOREIGN KEY ("id_produto_expedicao") REFERENCES "produto_expedicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
