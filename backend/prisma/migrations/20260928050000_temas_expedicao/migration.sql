CREATE TABLE "tema_expedicao" (
    "nome" VARCHAR(40) NOT NULL,
    "criado_em" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tema_expedicao_pkey" PRIMARY KEY ("nome")
);

INSERT INTO "tema_expedicao" ("nome")
SELECT DISTINCT UPPER(TRIM("tema"))
FROM "produto_expedicao"
WHERE TRIM("tema") <> ''
ON CONFLICT ("nome") DO NOTHING;
