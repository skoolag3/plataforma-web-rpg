CREATE TABLE "habilidade" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500),
    "modo_execucao" VARCHAR(20) NOT NULL DEFAULT 'AUTOMATICA',
    "tipo_efeito" VARCHAR(30) NOT NULL,
    "gatilho" VARCHAR(30) NOT NULL,
    "alvo" VARCHAR(30) NOT NULL,
    "atributo" VARCHAR(20),
    "unidade" VARCHAR(20) NOT NULL,
    "valor_base" INTEGER NOT NULL,
    "forma_aplicacao" VARCHAR(30) NOT NULL,
    "requisito_tipo" VARCHAR(30) NOT NULL DEFAULT 'NENHUM',
    "requisito_valor" INTEGER,
    "escala_tipo" VARCHAR(20) NOT NULL DEFAULT 'NENHUMA',
    "escala_valor" INTEGER,
    "escala_limite" INTEGER,
    "duracao_turnos" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "testada_em" TIMESTAMP(0) WITH TIME ZONE,
    "criado_em" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilidade_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "habilidade_nome_key" UNIQUE ("nome"),
    CONSTRAINT "chk_habilidade_modo" CHECK ("modo_execucao" = 'AUTOMATICA'),
    CONSTRAINT "chk_habilidade_tipo" CHECK ("tipo_efeito" IN (
        'BUFF', 'DEBUFF', 'DANO', 'CURA', 'ESCUDO', 'ROUBO_VIDA', 'EVASAO'
    )),
    CONSTRAINT "chk_habilidade_gatilho" CHECK ("gatilho" IN (
        'AO_ENTRAR', 'AO_ATACAR', 'AO_RECEBER_DANO', 'INICIO_TURNO', 'FIM_TURNO'
    )),
    CONSTRAINT "chk_habilidade_alvo" CHECK ("alvo" IN (
        'PROPRIA_CARTA', 'ALIADO_ATIVO', 'INIMIGO_ATIVO'
    )),
    CONSTRAINT "chk_habilidade_atributo" CHECK (
        ("tipo_efeito" IN ('BUFF', 'DEBUFF') AND "atributo" IN ('ATAQUE', 'DEFESA', 'VELOCIDADE'))
        OR ("tipo_efeito" NOT IN ('BUFF', 'DEBUFF') AND "atributo" IS NULL)
    ),
    CONSTRAINT "chk_habilidade_unidade" CHECK ("unidade" IN ('FIXO', 'PERCENTUAL')),
    CONSTRAINT "chk_habilidade_valor" CHECK (
        ("unidade" = 'FIXO' AND "valor_base" BETWEEN 1 AND 9999)
        OR ("unidade" = 'PERCENTUAL' AND "valor_base" BETWEEN 1 AND 500)
    ),
    CONSTRAINT "chk_habilidade_valor_especial" CHECK (
        ("tipo_efeito" = 'EVASAO' AND "unidade" = 'PERCENTUAL' AND "valor_base" <= 95)
        OR ("tipo_efeito" = 'ROUBO_VIDA' AND "unidade" = 'PERCENTUAL' AND "valor_base" <= 100)
        OR "tipo_efeito" NOT IN ('EVASAO', 'ROUBO_VIDA')
    ),
    CONSTRAINT "chk_habilidade_forma" CHECK ("forma_aplicacao" IN (
        'ANTES_ACAO', 'APOS_ACAO', 'SUBSTITUI_ATAQUE'
    )),
    CONSTRAINT "chk_habilidade_forma_gatilho" CHECK (
        "forma_aplicacao" <> 'SUBSTITUI_ATAQUE' OR "gatilho" = 'AO_ATACAR'
    ),
    CONSTRAINT "chk_habilidade_requisito" CHECK (
        ("requisito_tipo" = 'NENHUM' AND "requisito_valor" IS NULL)
        OR ("requisito_tipo" = 'CONTADOR_ATAQUES' AND "gatilho" = 'AO_ATACAR' AND "requisito_valor" BETWEEN 1 AND 20)
        OR ("requisito_tipo" = 'HP_ABAIXO' AND "requisito_valor" BETWEEN 1 AND 99)
        OR ("requisito_tipo" = 'TURNO_MINIMO' AND "requisito_valor" BETWEEN 1 AND 100)
    ),
    CONSTRAINT "chk_habilidade_escala" CHECK (
        ("escala_tipo" = 'NENHUMA' AND "escala_valor" IS NULL AND "escala_limite" IS NULL)
        OR (
            "escala_tipo" IN ('POR_TURNO', 'POR_ATAQUE')
            AND "escala_valor" IS NOT NULL
            AND "escala_limite" IS NOT NULL
            AND "escala_limite" >= "valor_base"
            AND (
                ("unidade" = 'FIXO' AND "escala_valor" BETWEEN 1 AND 9999 AND "escala_limite" BETWEEN 1 AND 9999)
                OR ("unidade" = 'PERCENTUAL' AND "escala_valor" BETWEEN 1 AND 500 AND "escala_limite" BETWEEN 1 AND 500)
            )
        )
    ),
    CONSTRAINT "chk_habilidade_escala_especial" CHECK (
        "escala_tipo" = 'NENHUMA'
        OR ("tipo_efeito" = 'EVASAO' AND "escala_valor" <= 95 AND "escala_limite" <= 95)
        OR ("tipo_efeito" = 'ROUBO_VIDA' AND "escala_valor" <= 100 AND "escala_limite" <= 100)
        OR "tipo_efeito" NOT IN ('EVASAO', 'ROUBO_VIDA')
    ),
    CONSTRAINT "chk_habilidade_duracao" CHECK (
        "duracao_turnos" IS NULL
        OR ("tipo_efeito" IN ('BUFF', 'DEBUFF', 'ESCUDO') AND "duracao_turnos" BETWEEN 1 AND 20)
    ),
    CONSTRAINT "chk_habilidade_status" CHECK ("status" IN ('RASCUNHO', 'PUBLICADA', 'INATIVA')),
    CONSTRAINT "chk_habilidade_versao" CHECK ("versao" >= 1)
);

CREATE TABLE "carta_habilidade" (
    "id_carta" UUID NOT NULL,
    "id_habilidade" UUID NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carta_habilidade_pkey" PRIMARY KEY ("id_carta", "id_habilidade"),
    CONSTRAINT "chk_carta_habilidade_ordem" CHECK ("ordem" >= 1),
    CONSTRAINT "carta_habilidade_id_carta_fkey"
        FOREIGN KEY ("id_carta") REFERENCES "carta"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "carta_habilidade_id_habilidade_fkey"
        FOREIGN KEY ("id_habilidade") REFERENCES "habilidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "habilidade_status_tipo_efeito_idx"
    ON "habilidade"("status", "tipo_efeito");

CREATE UNIQUE INDEX "carta_habilidade_id_carta_ordem_key"
    ON "carta_habilidade"("id_carta", "ordem");

CREATE INDEX "carta_habilidade_id_habilidade_idx"
    ON "carta_habilidade"("id_habilidade");

CREATE TRIGGER "set_timestamp_habilidade"
BEFORE UPDATE ON "habilidade"
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE "habilidade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carta_habilidade" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "habilidade", "carta_habilidade" FROM anon, authenticated;
