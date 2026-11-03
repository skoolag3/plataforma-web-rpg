UPDATE perfil_usuario
SET id_moldura = NULL
WHERE id_moldura IN (
  SELECT id FROM moldura WHERE slug IN ('padrao', 'violeta', 'rubi')
);

DELETE FROM usuario_moldura
WHERE id_moldura IN (
  SELECT id FROM moldura WHERE slug IN ('padrao', 'violeta', 'rubi')
);

DELETE FROM moldura
WHERE slug IN ('padrao', 'violeta', 'rubi');
