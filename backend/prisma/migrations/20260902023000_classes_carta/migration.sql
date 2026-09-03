CREATE TABLE "classe_carta" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome" VARCHAR(80) NOT NULL,
  "descricao" VARCHAR(255),
  "prioridade_ataque" INTEGER NOT NULL DEFAULT 3,
  "modificador_hp" INTEGER NOT NULL DEFAULT 0,
  "modificador_ataque" INTEGER NOT NULL DEFAULT 0,
  "modificador_defesa" INTEGER NOT NULL DEFAULT 0,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "classe_carta_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "classe_carta_nome_key" UNIQUE ("nome"),
  CONSTRAINT "classe_carta_prioridade_check" CHECK ("prioridade_ataque" BETWEEN 1 AND 99),
  CONSTRAINT "classe_carta_modificador_hp_check" CHECK ("modificador_hp" BETWEEN -90 AND 300),
  CONSTRAINT "classe_carta_modificador_ataque_check" CHECK ("modificador_ataque" BETWEEN -90 AND 300),
  CONSTRAINT "classe_carta_modificador_defesa_check" CHECK ("modificador_defesa" BETWEEN -90 AND 300)
);

CREATE INDEX "classe_carta_ativo_prioridade_ataque_idx"
  ON "classe_carta"("ativo", "prioridade_ataque");

INSERT INTO "classe_carta"
  ("nome", "descricao", "prioridade_ataque", "modificador_hp", "modificador_ataque", "modificador_defesa")
VALUES
  ('Assassino', 'Ataca primeiro, mas possui menor resistência.', 1, 0, 15, -15),
  ('Mago', 'Ofensivo e rápido, com vida reduzida.', 2, -10, 10, 0),
  ('Guerreiro', 'Classe equilibrada para confrontos diretos.', 3, 0, 5, 0),
  ('Suporte', 'Favorece efeitos automáticos e atua depois dos ofensivos.', 4, 0, -10, 5),
  ('Guardião', 'Alta defesa e menor poder ofensivo.', 5, 10, -15, 20)
ON CONFLICT ("nome") DO NOTHING;

ALTER TABLE "carta" ADD COLUMN "id_classe" UUID;

UPDATE "carta" AS c
SET "id_classe" = cc."id"
FROM "classe_carta" AS cc
WHERE LOWER(cc."nome") = LOWER(COALESCE(c."passiva"->>'classe', ''));

ALTER TABLE "carta"
  ADD CONSTRAINT "carta_id_classe_fkey"
  FOREIGN KEY ("id_classe") REFERENCES "classe_carta"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "carta_id_classe_idx" ON "carta"("id_classe");

ALTER TABLE "classe_carta" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "classe_carta" FROM anon, authenticated;
