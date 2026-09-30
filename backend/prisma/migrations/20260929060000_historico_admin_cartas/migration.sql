CREATE TABLE "log_admin_carta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_carta" UUID NOT NULL,
    "nome_carta" VARCHAR(150) NOT NULL,
    "id_admin" UUID,
    "acao" VARCHAR(20) NOT NULL,
    "alteracoes" JSONB,
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "log_admin_carta_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "log_admin_carta_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "log_admin_carta_criado_em_idx" ON "log_admin_carta"("criado_em" DESC);
CREATE INDEX "log_admin_carta_id_carta_criado_em_idx" ON "log_admin_carta"("id_carta", "criado_em" DESC);

-- Datas anteriores conhecidas; a autoria e as edições passadas não são inferidas.
INSERT INTO "log_admin_carta" ("id_carta", "nome_carta", "acao", "criado_em")
SELECT "id", "nome", 'CRIADA', "criado_em" FROM "carta" WHERE "criado_em" IS NOT NULL;

INSERT INTO "log_admin_carta" ("id_carta", "nome_carta", "acao", "criado_em")
SELECT "id", "nome", 'REMOVIDA', "excluido_em" FROM "carta" WHERE "excluido_em" IS NOT NULL;

ALTER TABLE "log_admin_carta" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "log_admin_carta" FROM anon, authenticated;
