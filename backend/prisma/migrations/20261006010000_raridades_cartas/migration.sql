CREATE TABLE "raridade_carta" (
  "codigo" VARCHAR(50) NOT NULL,
  "nome" VARCHAR(80) NOT NULL,
  "valor_venda" INTEGER NOT NULL DEFAULT 0,
  "cor" VARCHAR(7) NOT NULL DEFAULT '#a78bfa',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "raridade_carta_pkey" PRIMARY KEY ("codigo")
);
CREATE UNIQUE INDEX "raridade_carta_nome_key" ON "raridade_carta"("nome");
INSERT INTO "raridade_carta" ("codigo", "nome", "valor_venda", "cor", "ordem") VALUES
  ('N', 'Comum', 50, '#94a3b8', 1),
  ('R', 'Rara', 100, '#60a5fa', 2),
  ('SR', 'Épica', 200, '#c084fc', 3),
  ('SSR', 'Lendária', 400, '#facc15', 4),
  ('UR', 'Mítica', 800, '#e879f9', 5),
  ('SECRETA', 'Secreta', 1600, '#fb7185', 6);
