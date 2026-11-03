ALTER TABLE "habilidade"
    DROP CONSTRAINT "chk_habilidade_requisito",
    ADD CONSTRAINT "chk_habilidade_requisito" CHECK (
        ("requisito_tipo" = 'NENHUM' AND "requisito_valor" IS NULL)
        OR ("requisito_tipo" = 'CHANCE' AND "tipo_efeito" = 'CRITICO' AND "requisito_valor" BETWEEN 1 AND 100)
        OR ("requisito_tipo" = 'CONTADOR_ATAQUES' AND "gatilho" = 'AO_ATACAR' AND "requisito_valor" BETWEEN 1 AND 20)
        OR ("requisito_tipo" = 'HP_ABAIXO' AND "requisito_valor" BETWEEN 1 AND 99)
        OR ("requisito_tipo" = 'TURNO_MINIMO' AND "requisito_valor" BETWEEN 1 AND 100)
        OR ("requisito_tipo" = 'INTERVALO_TURNOS' AND "gatilho" = 'INICIO_TURNO' AND "requisito_valor" BETWEEN 2 AND 100)
    );
