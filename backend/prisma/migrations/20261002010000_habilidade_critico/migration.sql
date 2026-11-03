ALTER TABLE "habilidade"
    DROP CONSTRAINT "chk_habilidade_tipo",
    ADD CONSTRAINT "chk_habilidade_tipo" CHECK ("tipo_efeito" IN (
        'BUFF', 'DEBUFF', 'DANO', 'CURA', 'ESCUDO', 'ROUBO_VIDA', 'EVASAO', 'CRITICO'
    ));

ALTER TABLE "habilidade"
    DROP CONSTRAINT "chk_habilidade_requisito",
    ADD CONSTRAINT "chk_habilidade_requisito" CHECK (
        ("requisito_tipo" = 'NENHUM' AND "requisito_valor" IS NULL)
        OR ("requisito_tipo" = 'CHANCE' AND "tipo_efeito" = 'CRITICO' AND "requisito_valor" BETWEEN 1 AND 100)
        OR ("requisito_tipo" = 'CONTADOR_ATAQUES' AND "gatilho" = 'AO_ATACAR' AND "requisito_valor" BETWEEN 1 AND 20)
        OR ("requisito_tipo" = 'HP_ABAIXO' AND "requisito_valor" BETWEEN 1 AND 99)
        OR ("requisito_tipo" = 'TURNO_MINIMO' AND "requisito_valor" BETWEEN 1 AND 100)
    );
