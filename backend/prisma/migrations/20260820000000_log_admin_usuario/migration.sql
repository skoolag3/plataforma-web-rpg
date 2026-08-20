CREATE TABLE "log_admin_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_admin" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "acao" VARCHAR(50) NOT NULL,
    "categoria" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "detalhes" JSONB,
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_admin_usuario_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "log_admin_usuario_id_admin_fkey"
        FOREIGN KEY ("id_admin") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "log_admin_usuario_id_usuario_fkey"
        FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "log_admin_usuario_id_admin_criado_em_idx"
    ON "log_admin_usuario"("id_admin", "criado_em" DESC);

CREATE INDEX "log_admin_usuario_id_usuario_criado_em_idx"
    ON "log_admin_usuario"("id_usuario", "criado_em" DESC);

ALTER TABLE "log_admin_usuario" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "log_admin_usuario" FROM anon, authenticated;
