CREATE TABLE "correio_leitura" (
    "id_usuario" UUID NOT NULL,
    "chave" VARCHAR(150) NOT NULL,
    "lido_em" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correio_leitura_pkey" PRIMARY KEY ("id_usuario", "chave"),
    CONSTRAINT "correio_leitura_id_usuario_fkey"
        FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "correio_leitura_id_usuario_lido_em_idx"
    ON "correio_leitura"("id_usuario", "lido_em" DESC);

ALTER TABLE "correio_leitura" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "correio_leitura" FROM anon, authenticated;
