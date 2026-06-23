ALTER TABLE usuario
    ADD COLUMN token_verificacao_email_pendente VARCHAR(255),
    ADD COLUMN token_email_pendente_expira_em TIMESTAMPTZ(0);

CREATE UNIQUE INDEX usuario_token_verificacao_email_pendente_key
    ON usuario(token_verificacao_email_pendente);
