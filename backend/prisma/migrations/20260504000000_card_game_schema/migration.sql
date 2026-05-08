-- ==========================================
-- SCHEMA MELHORADO - CARD GAME
-- Versao: 2.0
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. AUTENTICACAO E USUARIOS
-- ==========================================

CREATE TABLE usuario (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                  VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) UNIQUE NOT NULL,
    senha_hash            VARCHAR(255) NOT NULL,

    is_admin              BOOLEAN DEFAULT FALSE,
    nivel                 INT DEFAULT 1,
    pontos_experiencia    INT DEFAULT 0,

    saldo_rubys_cache     INT DEFAULT 0,

    ativo                 BOOLEAN DEFAULT TRUE,
    criado_em             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    excluido_em           TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_usuario_nivel CHECK (nivel >= 1),
    CONSTRAINT chk_usuario_xp CHECK (pontos_experiencia >= 0),
    CONSTRAINT chk_usuario_rubys_cache CHECK (saldo_rubys_cache >= 0)
);

-- ==========================================
-- 2. ECONOMIA B2C E LOJA
-- ==========================================

CREATE TABLE pacote_ruby (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_stripe        VARCHAR(255) UNIQUE NOT NULL,
    nome             VARCHAR(100) NOT NULL,
    quantidade_rubys INT NOT NULL,
    preco_brl        DECIMAL(10,2) NOT NULL,
    ativo            BOOLEAN DEFAULT TRUE,

    criado_em        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pacote_ruby_quantidade CHECK (quantidade_rubys > 0),
    CONSTRAINT chk_pacote_ruby_preco CHECK (preco_brl >= 0)
);

CREATE TABLE log_transacao (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario       UUID REFERENCES usuario(id),
    id_pacote        UUID REFERENCES pacote_ruby(id),
    valor_brl        DECIMAL(10,2) NOT NULL,
    status_pagamento VARCHAR(50) NOT NULL,
    id_stripe_intent VARCHAR(255),
    timestamp_compra TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_log_transacao_status CHECK (
        status_pagamento IN ('PENDENTE', 'CONCLUIDO', 'FALHO', 'CANCELADO')
    ),
    CONSTRAINT chk_log_transacao_valor CHECK (valor_brl >= 0)
);

CREATE TABLE ledger_ruby (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    quantidade    INT NOT NULL,
    motivo        VARCHAR(50) NOT NULL,
    id_referencia UUID,
    descricao     TEXT,
    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ledger_motivo CHECK (
        motivo IN ('COMPRA', 'GIRO_BANNER', 'REEMBOLSO', 'BONUS_ADMIN', 'ESTORNO')
    )
);

-- ==========================================
-- 3. CORE DO JOGO E GACHA
-- ==========================================

CREATE TABLE carta (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(150) NOT NULL,
    elemento      VARCHAR(20) NOT NULL,
    raridade      VARCHAR(50) NOT NULL,

    hp_base       INT NOT NULL DEFAULT 0,
    dano_base     INT NOT NULL DEFAULT 0,
    defesa_base   INT NOT NULL DEFAULT 0,

    passiva       JSONB,
    foto          VARCHAR(255),
    ativo         BOOLEAN DEFAULT TRUE,

    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    excluido_em   TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_carta_elemento CHECK (
        elemento IN ('Blue', 'Red', 'Yellow', 'Green', 'White', 'Black')
    ),
    CONSTRAINT chk_carta_raridade CHECK (
        raridade IN ('COMUM', 'RARA', 'EPICA', 'LENDARIA', 'MITICA', 'CELESTIAL')
    ),
    CONSTRAINT chk_carta_status CHECK (
        hp_base >= 0 AND dano_base >= 0 AND defesa_base >= 0
    )
);

CREATE TABLE banner (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome          VARCHAR(150) NOT NULL,
    custo_giro    INT NOT NULL DEFAULT 100,
    ativo         BOOLEAN DEFAULT TRUE,

    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_banner_custo CHECK (custo_giro > 0)
);

CREATE TABLE banner_carta (
    id_banner UUID REFERENCES banner(id) ON DELETE CASCADE,
    id_carta  UUID REFERENCES carta(id) ON DELETE CASCADE,
    taxa_drop DECIMAL(5,2) NOT NULL,

    PRIMARY KEY (id_banner, id_carta),

    CONSTRAINT chk_taxa_drop_positiva CHECK (taxa_drop > 0)
);

CREATE OR REPLACE FUNCTION trigger_validar_soma_taxa_drop()
RETURNS TRIGGER AS $$
DECLARE
    soma_total DECIMAL(7,2);
BEGIN
    SELECT COALESCE(SUM(taxa_drop), 0)
      INTO soma_total
      FROM banner_carta
     WHERE id_banner = NEW.id_banner;

    IF soma_total > 100.01 THEN
        RAISE EXCEPTION 'Soma das taxas de drop do banner excede 100%% (atual: %)', soma_total;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER check_soma_taxa_drop
AFTER INSERT OR UPDATE ON banner_carta
FOR EACH ROW
EXECUTE FUNCTION trigger_validar_soma_taxa_drop();

CREATE TABLE log_gacha (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario      UUID NOT NULL REFERENCES usuario(id),
    id_banner       UUID NOT NULL REFERENCES banner(id),
    id_carta_obtida UUID NOT NULL REFERENCES carta(id),
    rubys_gastos    INT NOT NULL,
    pity_contador   INT NOT NULL DEFAULT 0,
    timestamp_pull  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rubys_gastos CHECK (rubys_gastos > 0)
);

CREATE TABLE usuario_banner_coleta (
    id_usuario    UUID REFERENCES usuario(id) ON DELETE CASCADE,
    id_banner     UUID REFERENCES banner(id) ON DELETE CASCADE,
    ultima_coleta TIMESTAMP WITH TIME ZONE,

    PRIMARY KEY (id_usuario, id_banner)
);

-- ==========================================
-- 4. INVENTARIO E DECKS
-- ==========================================

CREATE TABLE inventario (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID REFERENCES usuario(id) ON DELETE CASCADE,
    id_carta      UUID REFERENCES carta(id),
    quantidade    INT DEFAULT 1,

    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_inventario_usuario_carta UNIQUE (id_usuario, id_carta),
    CONSTRAINT chk_inventario_quantidade CHECK (quantidade >= 0)
);

CREATE TABLE deck (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario    UUID REFERENCES usuario(id) ON DELETE CASCADE,
    nome          VARCHAR(100) NOT NULL DEFAULT 'Meu Deck',
    ativo         BOOLEAN DEFAULT FALSE,

    criado_em     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    excluido_em   TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX uq_deck_ativo_por_usuario
    ON deck (id_usuario)
    WHERE ativo = TRUE AND excluido_em IS NULL;

CREATE TABLE deck_carta (
    id_deck      UUID REFERENCES deck(id) ON DELETE CASCADE,
    id_carta     UUID REFERENCES carta(id) ON DELETE CASCADE,
    posicao_slot INT NOT NULL,
    criado_em    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_deck, id_carta),

    CONSTRAINT uq_deck_posicao UNIQUE (id_deck, posicao_slot),
    CONSTRAINT chk_posicao_slot CHECK (posicao_slot BETWEEN 1 AND 6)
);

-- ==========================================
-- 5. HISTORICO DE PARTIDAS E RANKING
-- ==========================================

CREATE TABLE log_partida (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario          UUID REFERENCES usuario(id),
    id_usuario_oponente UUID REFERENCES usuario(id),
    id_deck_usado       UUID REFERENCES deck(id),
    resultado           VARCHAR(20) NOT NULL,
    turnos_jogados      INT NOT NULL DEFAULT 0,
    variacao_pontos     INT DEFAULT 0,

    timestamp_inicio    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    timestamp_fim       TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_resultado_partida CHECK (
        resultado IN ('VITORIA', 'DERROTA', 'EMPATE')
    ),
    CONSTRAINT chk_turnos CHECK (turnos_jogados >= 0),
    CONSTRAINT chk_oponente_diferente CHECK (
        id_usuario_oponente IS NULL OR id_usuario <> id_usuario_oponente
    )
);

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

-- ==========================================
-- 6. TRIGGERS DE ATUALIZACAO E SEGURANCA
-- ==========================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER set_timestamp_usuario BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_pacote BEFORE UPDATE ON pacote_ruby FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_carta BEFORE UPDATE ON carta FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_banner BEFORE UPDATE ON banner FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_inventario BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_deck BEFORE UPDATE ON deck FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE FUNCTION trigger_validar_dono_carta_deck()
RETURNS TRIGGER AS $$
DECLARE
    dono_deck      UUID;
    qtd_inventario INT;
BEGIN
    SELECT id_usuario INTO dono_deck FROM deck WHERE id = NEW.id_deck;

    SELECT quantidade INTO qtd_inventario
      FROM inventario
     WHERE id_usuario = dono_deck AND id_carta = NEW.id_carta;

    IF qtd_inventario IS NULL OR qtd_inventario <= 0 THEN
        RAISE EXCEPTION 'Fraude detectada: a carta % nao pertence ao dono do deck.', NEW.id_carta;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER check_dono_carta_deck
BEFORE INSERT OR UPDATE ON deck_carta
FOR EACH ROW
EXECUTE FUNCTION trigger_validar_dono_carta_deck();

CREATE OR REPLACE FUNCTION trigger_atualizar_cache_rubys()
RETURNS TRIGGER AS $$
DECLARE
    novo_saldo INT;
BEGIN
    SELECT COALESCE(SUM(quantidade), 0)
      INTO novo_saldo
      FROM ledger_ruby
     WHERE id_usuario = NEW.id_usuario;

    IF novo_saldo < 0 THEN
        RAISE EXCEPTION 'Saldo de rubys insuficiente para o usuario %.', NEW.id_usuario;
    END IF;

    UPDATE usuario
       SET saldo_rubys_cache = novo_saldo
     WHERE id = NEW.id_usuario;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER sync_saldo_rubys_cache
AFTER INSERT ON ledger_ruby
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_cache_rubys();

-- ==========================================
-- 7. INDICES DE PERFORMANCE
-- ==========================================

CREATE INDEX idx_usuario_email_ativo ON usuario(email) WHERE excluido_em IS NULL;

CREATE INDEX idx_log_transacao_usuario ON log_transacao(id_usuario);
CREATE INDEX idx_ledger_ruby_usuario ON ledger_ruby(id_usuario);

CREATE INDEX idx_carta_raridade ON carta(raridade) WHERE excluido_em IS NULL;
CREATE INDEX idx_banner_carta_banner ON banner_carta(id_banner);

CREATE INDEX idx_log_gacha_usuario ON log_gacha(id_usuario);
CREATE INDEX idx_log_gacha_banner ON log_gacha(id_banner);
CREATE INDEX idx_log_gacha_timestamp ON log_gacha(timestamp_pull DESC);

CREATE INDEX idx_inventario_usuario ON inventario(id_usuario);
CREATE INDEX idx_deck_usuario ON deck(id_usuario) WHERE excluido_em IS NULL;

CREATE INDEX idx_log_partida_usuario ON log_partida(id_usuario);
CREATE INDEX idx_log_partida_oponente ON log_partida(id_usuario_oponente);
CREATE INDEX idx_log_partida_timestamp ON log_partida(timestamp_inicio DESC);

-- ==========================================
-- 8. SUPABASE SECURITY LINTER
-- ==========================================

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
