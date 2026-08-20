ALTER TABLE "log_partida"
    RENAME COLUMN "recompensa_moedas" TO "recompensa_rubys";

ALTER TABLE "ledger_ruby"
    DROP CONSTRAINT IF EXISTS "chk_ledger_motivo";

ALTER TABLE "ledger_ruby"
    ADD CONSTRAINT "chk_ledger_motivo"
    CHECK ("motivo" IN (
        'COMPRA',
        'GIRO_BANNER',
        'REEMBOLSO',
        'BONUS_ADMIN',
        'ESTORNO',
        'AJUSTE_ADMIN',
        'VITORIA_PARTIDA'
    ));

DROP TABLE "ledger_moeda";

ALTER TABLE "usuario"
    DROP COLUMN "saldo_moedas_cache";

ALTER TABLE "moldura"
    DROP COLUMN "preco_moedas";

DROP FUNCTION IF EXISTS trigger_atualizar_cache_moedas();
