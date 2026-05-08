ALTER TABLE usuario
    ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN token_verificacao_email VARCHAR(255),
    ADD COLUMN token_verificacao_expira_em TIMESTAMP WITH TIME ZONE,
    ADD COLUMN bloqueado BOOLEAN DEFAULT FALSE,
    ADD COLUMN tentativas_login INT DEFAULT 0;

ALTER TABLE usuario
    ALTER COLUMN email_verificado SET DEFAULT FALSE;

CREATE UNIQUE INDEX usuario_token_verificacao_email_key
    ON usuario(token_verificacao_email);
