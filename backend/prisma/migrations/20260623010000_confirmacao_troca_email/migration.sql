ALTER TABLE usuario
    ADD COLUMN email_pendente VARCHAR(255),
    ADD COLUMN token_confirmacao_troca_email VARCHAR(255),
    ADD COLUMN token_troca_email_expira_em TIMESTAMPTZ(0);

CREATE UNIQUE INDEX usuario_token_confirmacao_troca_email_key
    ON usuario(token_confirmacao_troca_email);
