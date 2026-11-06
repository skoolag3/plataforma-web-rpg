-- Libera e-mails de contas excluídas que ainda retêm o e-mail original
UPDATE "usuario"
SET "email" = 'excluido-' || REPLACE("id"::text, '-', '') || '@anon.invalid',
    "token_verificacao_email" = NULL,
    "token_verificacao_expira_em" = NULL,
    "token_redefinicao_senha" = NULL,
    "token_redefinicao_expira_em" = NULL,
    "email_pendente" = NULL,
    "token_confirmacao_troca_email" = NULL,
    "token_troca_email_expira_em" = NULL,
    "token_verificacao_email_pendente" = NULL,
    "token_email_pendente_expira_em" = NULL,
    "email_verificado" = false,
    "ativo" = false,
    "bloqueado" = true
WHERE "excluido_em" IS NOT NULL
  AND "email" NOT LIKE 'excluido-%@anon.invalid';

-- Remove vínculos OAuth de contas que foram excluídas
DELETE FROM "provedor_usuario"
WHERE "id_usuario" IN (
  SELECT "id" FROM "usuario" WHERE "excluido_em" IS NOT NULL
);
