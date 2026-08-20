ALTER TABLE "log_partida"
    ALTER COLUMN "resultado" SET DEFAULT 'EM_ANDAMENTO',
    ADD COLUMN "recompensa_moedas" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "log_partida" DROP CONSTRAINT IF EXISTS "chk_resultado_partida";
ALTER TABLE "log_partida"
    ADD CONSTRAINT "chk_resultado_partida"
    CHECK ("resultado" IN ('EM_ANDAMENTO', 'VITORIA', 'DERROTA', 'EMPATE'));

CREATE UNIQUE INDEX "uq_partida_em_andamento_usuario"
    ON "log_partida"("id_usuario")
    WHERE "resultado" = 'EM_ANDAMENTO';

CREATE TABLE "partida_carta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_partida" UUID NOT NULL,
    "id_carta" UUID NOT NULL,
    "lado" VARCHAR(10) NOT NULL,
    "posicao" INTEGER NOT NULL,
    "nome_snapshot" VARCHAR(150) NOT NULL,
    "raridade" VARCHAR(50) NOT NULL,
    "elemento" VARCHAR(20) NOT NULL,
    "foto" VARCHAR(500),
    "moldura" VARCHAR(500),
    "config_visual" JSONB,
    "passiva" JSONB,
    "hp_base" INTEGER NOT NULL,
    "ataque_base" INTEGER NOT NULL,
    "defesa_base" INTEGER NOT NULL,
    "velocidade_base" INTEGER NOT NULL,
    "hp_atual" INTEGER NOT NULL,
    "ataque_atual" INTEGER NOT NULL,
    "defesa_atual" INTEGER NOT NULL,
    "velocidade_atual" INTEGER NOT NULL,
    "derrotada" BOOLEAN NOT NULL DEFAULT FALSE,
    "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partida_carta_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partida_carta_lado_check" CHECK ("lado" IN ('JOGADOR', 'BOT')),
    CONSTRAINT "partida_carta_posicao_check" CHECK ("posicao" BETWEEN 1 AND 6),
    CONSTRAINT "partida_carta_hp_check" CHECK ("hp_atual" >= 0),
    CONSTRAINT "partida_carta_id_partida_fkey" FOREIGN KEY ("id_partida") REFERENCES "log_partida"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "partida_carta_id_carta_fkey" FOREIGN KEY ("id_carta") REFERENCES "carta"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "partida_carta_id_partida_lado_posicao_key" ON "partida_carta"("id_partida", "lado", "posicao");
CREATE INDEX "partida_carta_id_partida_lado_derrotada_idx" ON "partida_carta"("id_partida", "lado", "derrotada");

CREATE TABLE "evento_partida" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_partida" UUID NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "turno" INTEGER NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "origem" VARCHAR(10),
    "texto" VARCHAR(500) NOT NULL,
    "valor" INTEGER,
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evento_partida_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evento_partida_origem_check" CHECK ("origem" IS NULL OR "origem" IN ('JOGADOR', 'BOT')),
    CONSTRAINT "evento_partida_turno_check" CHECK ("turno" >= 0),
    CONSTRAINT "evento_partida_id_partida_fkey" FOREIGN KEY ("id_partida") REFERENCES "log_partida"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "evento_partida_id_partida_sequencia_key" ON "evento_partida"("id_partida", "sequencia");
CREATE INDEX "evento_partida_id_partida_turno_idx" ON "evento_partida"("id_partida", "turno");

ALTER TABLE "partida_carta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evento_partida" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "partida_carta", "evento_partida" FROM anon, authenticated;
