ALTER TABLE "banner"
ADD COLUMN "inicio_em" TIMESTAMPTZ(0),
ADD COLUMN "fim_em" TIMESTAMPTZ(0),
ADD COLUMN "configuracao" JSONB;

CREATE INDEX "banner_agendamento_idx" ON "banner" ("ativo", "inicio_em", "fim_em");
