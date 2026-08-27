CREATE TABLE "banner_rotacao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "id_banner" UUID NOT NULL,
    "proxima_rotacao_em" TIMESTAMPTZ(0) NOT NULL,
    "forcado_por_admin" BOOLEAN NOT NULL DEFAULT false,
    "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_rotacao_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "banner_rotacao_id_unico" CHECK ("id" = 1)
);

CREATE INDEX "banner_rotacao_id_banner_idx" ON "banner_rotacao"("id_banner");

ALTER TABLE "banner_rotacao"
ADD CONSTRAINT "banner_rotacao_id_banner_fkey"
FOREIGN KEY ("id_banner") REFERENCES "banner"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
