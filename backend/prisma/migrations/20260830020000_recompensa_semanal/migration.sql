ALTER TABLE "usuario"
    ADD COLUMN "ultima_recompensa_semanal_em" TIMESTAMP(0) WITH TIME ZONE;

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
        'VITORIA_PARTIDA',
        'RECOMPENSA_SEMANAL'
    ));
