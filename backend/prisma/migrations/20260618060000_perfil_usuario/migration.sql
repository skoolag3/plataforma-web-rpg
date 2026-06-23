ALTER TABLE usuario
    ADD COLUMN ultimo_login_em TIMESTAMPTZ(0);

CREATE TABLE perfil_usuario (
    id_usuario UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    biografia VARCHAR(280) NOT NULL DEFAULT '',
    moldura VARCHAR(100) NOT NULL DEFAULT 'Padrao',
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    receber_notificacoes BOOLEAN NOT NULL DEFAULT TRUE,
    mostrar_no_ranking BOOLEAN NOT NULL DEFAULT TRUE,
    ocultar_historico BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO perfil_usuario (id_usuario)
SELECT id
FROM usuario
ON CONFLICT (id_usuario) DO NOTHING;

CREATE TRIGGER set_timestamp_perfil_usuario
BEFORE UPDATE ON perfil_usuario
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE perfil_usuario FROM anon, authenticated;
