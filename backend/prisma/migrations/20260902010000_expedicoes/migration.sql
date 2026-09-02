CREATE TABLE "expedicao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_usuario" UUID NOT NULL,
    "id_deck" UUID NOT NULL,
    "seed" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO',
    "etapa_atual" INTEGER NOT NULL DEFAULT 0,
    "trilha" JSONB NOT NULL,
    "escolhas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "escolha_atual" VARCHAR(80),
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMPTZ(0),
    CONSTRAINT "expedicao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expedicao_status_check" CHECK ("status" IN ('EM_ANDAMENTO', 'CONCLUIDA', 'FALHOU', 'ABANDONADA')),
    CONSTRAINT "expedicao_etapa_check" CHECK ("etapa_atual" BETWEEN 0 AND 3),
    CONSTRAINT "expedicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expedicao_id_deck_fkey" FOREIGN KEY ("id_deck") REFERENCES "deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_expedicao_ativa_usuario"
    ON "expedicao"("id_usuario")
    WHERE "status" = 'EM_ANDAMENTO';
CREATE INDEX "expedicao_id_usuario_criado_em_idx" ON "expedicao"("id_usuario", "criado_em" DESC);

ALTER TABLE "log_partida"
    ADD COLUMN "id_expedicao" UUID,
    ADD COLUMN "etapa_expedicao" INTEGER,
    ADD CONSTRAINT "log_partida_id_expedicao_fkey" FOREIGN KEY ("id_expedicao") REFERENCES "expedicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "log_partida_id_expedicao_etapa_expedicao_idx" ON "log_partida"("id_expedicao", "etapa_expedicao");

ALTER TABLE "expedicao" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "expedicao" FROM anon, authenticated;
