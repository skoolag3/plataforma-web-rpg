UPDATE "carta"
SET
  "passiva" = jsonb_set(
    COALESCE("passiva"::jsonb, '{}'::jsonb),
    '{custo}',
    to_jsonb(
      CASE "raridade"
        WHEN 'UR' THEN 800
        WHEN 'SSR' THEN 400
        WHEN 'SR' THEN 200
        WHEN 'R' THEN 100
        ELSE 50
      END
    ),
    true
  ),
  "atualizado_em" = CURRENT_TIMESTAMP
WHERE "excluido_em" IS NULL;
