ALTER TABLE usuario
    ADD COLUMN saldo_moedas_cache INT NOT NULL DEFAULT 0,
    ADD COLUMN desativado_em TIMESTAMPTZ(0),
    ADD COLUMN exclusao_agendada_em TIMESTAMPTZ(0);

CREATE TABLE moldura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(80) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    classe_css VARCHAR(80) NOT NULL,
    preco_moedas INT NOT NULL DEFAULT 0 CHECK (preco_moedas >= 0),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE perfil_usuario
    ADD COLUMN id_moldura UUID REFERENCES moldura(id);

CREATE TABLE usuario_moldura (
    id_usuario UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_moldura UUID NOT NULL REFERENCES moldura(id) ON DELETE CASCADE,
    obtido_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_moldura)
);

CREATE TABLE provedor_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    provedor VARCHAR(30) NOT NULL,
    id_provedor VARCHAR(255) NOT NULL,
    email_provedor VARCHAR(255),
    criado_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login_em TIMESTAMPTZ(0),
    UNIQUE (provedor, id_provedor),
    UNIQUE (id_usuario, provedor)
);

CREATE TABLE ledger_moeda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    quantidade INT NOT NULL,
    motivo VARCHAR(50) NOT NULL,
    id_referencia UUID,
    descricao TEXT,
    criado_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_moeda_id_usuario ON ledger_moeda(id_usuario);

CREATE OR REPLACE FUNCTION trigger_atualizar_cache_moedas()
RETURNS TRIGGER AS $$
DECLARE
    novo_saldo INT;
BEGIN
    SELECT COALESCE(SUM(quantidade), 0)
      INTO novo_saldo
      FROM ledger_moeda
     WHERE id_usuario = NEW.id_usuario;

    IF novo_saldo < 0 THEN
        RAISE EXCEPTION 'Saldo de moedas insuficiente para o usuario %.', NEW.id_usuario;
    END IF;

    UPDATE usuario SET saldo_moedas_cache = novo_saldo WHERE id = NEW.id_usuario;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER sync_saldo_moedas_cache
AFTER INSERT ON ledger_moeda
FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_cache_moedas();

CREATE TABLE solicitacao_exclusao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADA',
    solicitada_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executar_apos TIMESTAMPTZ(0) NOT NULL,
    cancelada_em TIMESTAMPTZ(0),
    executada_em TIMESTAMPTZ(0)
);

CREATE INDEX idx_solicitacao_exclusao_pendente
    ON solicitacao_exclusao(status, executar_apos);

INSERT INTO moldura (slug, nome, descricao, classe_css, preco_moedas)
VALUES
    ('padrao', 'Padrão', 'Moldura inicial de todos os jogadores.', 'molduraPadrao', 0),
    ('violeta', 'Relâmpago violeta', 'Energia violeta para perfis competitivos.', 'molduraVioleta', 750),
    ('rubi', 'Chama rubi', 'Moldura vermelha de edição especial.', 'molduraRubi', 1200)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO usuario_moldura (id_usuario, id_moldura)
SELECT u.id, m.id FROM usuario u CROSS JOIN moldura m WHERE m.slug = 'padrao'
ON CONFLICT DO NOTHING;

UPDATE perfil_usuario p
SET id_moldura = m.id
FROM moldura m
WHERE m.slug = 'padrao' AND p.id_moldura IS NULL;

ALTER TABLE moldura ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_moldura ENABLE ROW LEVEL SECURITY;
ALTER TABLE provedor_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_moeda ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacao_exclusao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE moldura, usuario_moldura, provedor_usuario, ledger_moeda, solicitacao_exclusao
FROM anon, authenticated;

-- Bucket publico para leitura; escrita permanece restrita ao backend com service role.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'perfis',
    'perfis',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
