ALTER TABLE "ledger_ruby" DROP CONSTRAINT IF EXISTS "chk_ledger_motivo";

ALTER TABLE "ledger_ruby"
    ADD CONSTRAINT "chk_ledger_motivo"
    CHECK ("motivo" IN (
        'COMPRA',
        'GIRO_BANNER',
        'REEMBOLSO',
        'BONUS_ADMIN',
        'ESTORNO',
        'AJUSTE_ADMIN'
    ));
