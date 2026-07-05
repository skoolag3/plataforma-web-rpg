ALTER TABLE carta
DROP CONSTRAINT IF EXISTS chk_carta_elemento;

ALTER TABLE carta
ADD CONSTRAINT chk_carta_elemento CHECK (
    elemento IN ('natureza', 'agua', 'fogo', 'sombra', 'luz')
);

ALTER TABLE carta
DROP CONSTRAINT IF EXISTS chk_carta_raridade;

ALTER TABLE carta
ADD CONSTRAINT chk_carta_raridade CHECK (
    raridade IN ('UR', 'SSR', 'SR', 'R', 'N')
);
