CREATE TABLE "configuracao_campanha" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "recompensa_facil" INTEGER NOT NULL DEFAULT 25,
    "recompensa_media" INTEGER NOT NULL DEFAULT 25,
    "recompensa_dificil" INTEGER NOT NULL DEFAULT 25,
    "recompensa_chefe" INTEGER NOT NULL DEFAULT 100,
    "percentual_mantido_derrota" INTEGER NOT NULL DEFAULT 70,
    "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracao_campanha_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "configuracao_campanha_unica_check" CHECK ("id" = 1),
    CONSTRAINT "configuracao_campanha_recompensas_check" CHECK (
        "recompensa_facil" >= 0 AND
        "recompensa_media" >= 0 AND
        "recompensa_dificil" >= 0 AND
        "recompensa_chefe" >= 0
    ),
    CONSTRAINT "configuracao_campanha_percentual_check" CHECK (
        "percentual_mantido_derrota" BETWEEN 0 AND 100
    )
);

INSERT INTO "configuracao_campanha" ("id") VALUES (1);
