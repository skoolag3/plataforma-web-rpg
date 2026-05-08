ALTER VIEW ranking_jogadores SET (security_invoker = true);

ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacote_ruby ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_transacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_ruby ENABLE ROW LEVEL SECURITY;
ALTER TABLE carta ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_carta ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_gacha ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_banner_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_carta ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_partida ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE _prisma_migrations FROM anon, authenticated;
REVOKE ALL ON TABLE usuario FROM anon, authenticated;
REVOKE ALL ON TABLE pacote_ruby FROM anon, authenticated;
REVOKE ALL ON TABLE log_transacao FROM anon, authenticated;
REVOKE ALL ON TABLE ledger_ruby FROM anon, authenticated;
REVOKE ALL ON TABLE carta FROM anon, authenticated;
REVOKE ALL ON TABLE banner FROM anon, authenticated;
REVOKE ALL ON TABLE banner_carta FROM anon, authenticated;
REVOKE ALL ON TABLE log_gacha FROM anon, authenticated;
REVOKE ALL ON TABLE usuario_banner_coleta FROM anon, authenticated;
REVOKE ALL ON TABLE inventario FROM anon, authenticated;
REVOKE ALL ON TABLE deck FROM anon, authenticated;
REVOKE ALL ON TABLE deck_carta FROM anon, authenticated;
REVOKE ALL ON TABLE log_partida FROM anon, authenticated;
REVOKE ALL ON TABLE ranking_jogadores FROM anon, authenticated;

ALTER FUNCTION trigger_set_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_validar_dono_carta_deck() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_atualizar_cache_rubys() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_validar_soma_taxa_drop() SET search_path = public, pg_temp;
