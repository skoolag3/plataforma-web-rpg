ALTER TABLE "usuario"
ADD COLUMN "senha_definida" BOOLEAN NOT NULL DEFAULT true;

UPDATE "usuario" AS usuario
SET "senha_definida" = false
WHERE EXISTS (
  SELECT 1
  FROM "provedor_usuario" AS provedor
  WHERE provedor."id_usuario" = usuario."id"
    AND provedor."provedor" = 'GOOGLE'
    AND ABS(EXTRACT(EPOCH FROM (provedor."criado_em" - usuario."criado_em"))) <= 10
);
