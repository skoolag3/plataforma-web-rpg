CREATE TABLE "noticia" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "titulo" VARCHAR(180) NOT NULL,
  "resumo" VARCHAR(320) NOT NULL,
  "conteudo" TEXT NOT NULL,
  "imagem" VARCHAR(500),
  "categoria" VARCHAR(30) NOT NULL DEFAULT 'NOVIDADE',
  "anexos" JSONB,
  "publicada" BOOLEAN NOT NULL DEFAULT false,
  "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noticia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "noticia_publicada_criado_em_idx"
ON "noticia"("publicada", "criado_em" DESC);
