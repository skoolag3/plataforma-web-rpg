ALTER TABLE usuario
    ADD COLUMN token_redefinicao_senha VARCHAR(255),
    ADD COLUMN token_redefinicao_expira_em TIMESTAMPTZ(0);

CREATE UNIQUE INDEX usuario_token_redefinicao_senha_key
    ON usuario(token_redefinicao_senha);
