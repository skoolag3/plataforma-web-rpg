ALTER TABLE "perfil_usuario"
ADD COLUMN "id_carta_moldura" UUID;

CREATE INDEX "perfil_usuario_id_carta_moldura_idx"
ON "perfil_usuario"("id_carta_moldura");

ALTER TABLE "perfil_usuario"
ADD CONSTRAINT "perfil_usuario_id_carta_moldura_fkey"
FOREIGN KEY ("id_carta_moldura") REFERENCES "carta"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
