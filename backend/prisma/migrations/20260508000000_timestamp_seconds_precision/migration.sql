DROP VIEW IF EXISTS ranking_jogadores;

ALTER TABLE usuario
    ALTER COLUMN token_verificacao_expira_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN excluido_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE pacote_ruby
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE log_transacao
    ALTER COLUMN timestamp_compra TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE ledger_ruby
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE carta
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN excluido_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE banner
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE log_gacha
    ALTER COLUMN timestamp_pull TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE usuario_banner_coleta
    ALTER COLUMN ultima_coleta TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE inventario
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE deck
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN atualizado_em TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN excluido_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE deck_carta
    ALTER COLUMN criado_em TYPE TIMESTAMP(0) WITH TIME ZONE;

ALTER TABLE log_partida
    ALTER COLUMN timestamp_inicio TYPE TIMESTAMP(0) WITH TIME ZONE,
    ALTER COLUMN timestamp_fim TYPE TIMESTAMP(0) WITH TIME ZONE;

CREATE VIEW ranking_jogadores
WITH (security_invoker = true) AS
SELECT
    u.id AS id_usuario,
    u.nome,
    u.nivel,
    u.pontos_experiencia,
    SUM(lp.variacao_pontos) AS pontuacao_total,
    COUNT(lp.id) FILTER (WHERE lp.resultado = 'VITORIA') AS total_vitorias,
    COUNT(lp.id) FILTER (WHERE lp.resultado = 'DERROTA') AS total_derrotas,
    COUNT(lp.id) FILTER (WHERE lp.resultado = 'EMPATE') AS total_empates
FROM usuario u
LEFT JOIN log_partida lp ON u.id = lp.id_usuario
WHERE u.excluido_em IS NULL AND u.is_admin = FALSE
GROUP BY u.id, u.nome, u.nivel, u.pontos_experiencia
ORDER BY pontuacao_total DESC, total_vitorias DESC;

REVOKE ALL ON TABLE ranking_jogadores FROM anon, authenticated;
