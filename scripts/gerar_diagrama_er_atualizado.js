"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputDir = path.resolve(__dirname, "../../plataforma-web-rpg-arquivos/documentacao/diagramas");
fs.mkdirSync(outputDir, { recursive: true });
const svgPath = path.join(outputDir, "03-modelo-dados-relacional-atualizado.svg");
const pngPath = path.join(outputDir, "03-modelo-dados-relacional-atualizado.png");

const groups = [
  { title: "Identidade e perfil", x: 30, y: 80, w: 710, h: 650 },
  { title: "Cartas e decks", x: 760, y: 80, w: 930, h: 850 },
  { title: "Administração e comunicação", x: 1710, y: 80, w: 660, h: 650 },
  { title: "Economia e gacha", x: 30, y: 750, w: 710, h: 790 },
  { title: "Batalha e expedição", x: 760, y: 950, w: 1610, h: 590 },
];

const entities = [
  { id: "usuario", title: "usuario", x: 60, y: 125, fields: ["PK id: UUID", "UQ email: varchar", "nome: varchar", "is_admin: boolean", "saldo_rubys_cache: int"] },
  { id: "perfil", title: "perfil_usuario", x: 390, y: 125, fields: ["PK/FK id_usuario: UUID", "FK id_moldura: UUID?", "FK id_carta_moldura: UUID?", "avatar_url: varchar?", "mostrar_no_ranking: boolean"] },
  { id: "provedor", title: "provedor_usuario", x: 60, y: 330, fields: ["PK id: UUID", "FK id_usuario: UUID", "provedor: varchar", "id_provedor: varchar"] },
  { id: "moldura", title: "moldura", x: 390, y: 350, fields: ["PK id: UUID", "UQ slug: varchar", "nome: varchar", "classe_css: varchar"] },
  { id: "usuario_moldura", title: "usuario_moldura", x: 60, y: 520, fields: ["PK/FK id_usuario: UUID", "PK/FK id_moldura: UUID", "obtido_em: timestamp"] },
  { id: "solicitacao_exclusao", title: "solicitacao_exclusao", x: 390, y: 535, fields: ["PK id: UUID", "FK id_usuario: UUID", "status: varchar", "executar_apos: timestamp"] },

  { id: "classe", title: "classe_carta", x: 790, y: 125, fields: ["PK id: UUID", "UQ nome: varchar", "prioridade_ataque: int", "modificadores: int", "ativo: boolean"] },
  { id: "carta", title: "carta", x: 1090, y: 125, fields: ["PK id: UUID", "FK id_classe: UUID?", "nome: varchar", "raridade: varchar", "hp/dano/defesa: int"] },
  { id: "habilidade", title: "habilidade", x: 1390, y: 125, fields: ["PK id: UUID", "UQ nome: varchar", "gatilho: varchar", "tipo_efeito: varchar", "status: varchar"] },
  { id: "carta_habilidade", title: "carta_habilidade", x: 940, y: 355, fields: ["PK/FK id_carta: UUID", "PK/FK id_habilidade: UUID", "ordem: int"] },
  { id: "inventario", title: "inventario", x: 1240, y: 355, fields: ["PK id: UUID", "FK id_usuario: UUID?", "FK id_carta: UUID?", "quantidade: int"] },
  { id: "deck", title: "deck", x: 790, y: 570, fields: ["PK id: UUID", "FK id_usuario: UUID?", "nome: varchar", "ativo: boolean"] },
  { id: "deck_carta", title: "deck_carta", x: 1090, y: 570, fields: ["PK/FK id_deck: UUID", "PK/FK id_carta: UUID", "UQ posicao_slot: int"] },

  { id: "noticia", title: "noticia", x: 1740, y: 125, fields: ["PK id: UUID", "titulo: varchar", "categoria: varchar", "publicada: boolean", "imagem: varchar?"] },
  { id: "correio", title: "correio_leitura", x: 2040, y: 125, fields: ["PK/FK id_usuario: UUID", "PK chave: varchar", "lido_em: timestamp"] },
  { id: "log_admin", title: "log_admin_usuario", x: 1740, y: 350, fields: ["PK id: UUID", "FK id_admin: UUID", "FK id_usuario: UUID", "acao: varchar", "detalhes: JSON?"] },

  { id: "banner", title: "banner", x: 60, y: 800, fields: ["PK id: UUID", "nome: varchar", "custo_giro: int", "ativo: boolean"] },
  { id: "banner_carta", title: "banner_carta", x: 390, y: 800, fields: ["PK/FK id_banner: UUID", "PK/FK id_carta: UUID", "taxa_drop: decimal"] },
  { id: "banner_rotacao", title: "banner_rotacao", x: 60, y: 995, fields: ["PK id: int", "FK id_banner: UUID", "proxima_rotacao_em: timestamp", "forcado_por_admin: boolean"] },
  { id: "banner_coleta", title: "usuario_banner_coleta", x: 390, y: 995, fields: ["PK/FK id_usuario: UUID", "PK/FK id_banner: UUID", "ultima_coleta: timestamp?"] },
  { id: "log_gacha", title: "log_gacha", x: 60, y: 1205, fields: ["PK id: UUID", "FK id_usuario: UUID", "FK id_banner: UUID", "FK id_carta_obtida: UUID", "pity_contador: int"] },
  { id: "ledger", title: "ledger_ruby", x: 390, y: 1205, fields: ["PK id: UUID", "FK id_usuario: UUID", "quantidade: int", "motivo: varchar", "id_referencia: UUID?"] },
  { id: "pacote", title: "pacote_ruby", x: 60, y: 1400, fields: ["PK id: UUID", "UQ id_stripe: varchar", "quantidade_rubys: int", "preco_brl: decimal"] },
  { id: "transacao", title: "log_transacao", x: 390, y: 1400, fields: ["PK id: UUID", "FK id_usuario: UUID?", "FK id_pacote: UUID?", "status_pagamento: varchar"] },

  { id: "expedicao", title: "expedicao", x: 800, y: 1000, fields: ["PK id: UUID", "FK id_usuario: UUID", "FK id_deck: UUID", "seed: int", "trilha: JSON"] },
  { id: "log_partida", title: "log_partida", x: 1110, y: 1000, fields: ["PK id: UUID", "FK id_usuario: UUID?", "FK id_deck_usado: UUID?", "FK id_expedicao: UUID?", "recompensa_rubys: int"] },
  { id: "partida_carta", title: "partida_carta", x: 1420, y: 1000, fields: ["PK id: UUID", "FK id_partida: UUID", "FK id_carta: UUID", "lado/posicao", "atributos snapshot"] },
  { id: "evento_partida", title: "evento_partida", x: 1730, y: 1000, fields: ["PK id: UUID", "FK id_partida: UUID", "sequencia: int", "turno: int", "tipo: varchar"] },
];

const links = [
  ["usuario", "perfil", "1", "0..1"], ["usuario", "provedor", "1", "N"], ["usuario", "usuario_moldura", "1", "N"],
  ["moldura", "usuario_moldura", "1", "N"], ["moldura", "perfil", "1", "N"], ["usuario", "solicitacao_exclusao", "1", "N"],
  ["classe", "carta", "1", "N"], ["carta", "carta_habilidade", "1", "N"], ["habilidade", "carta_habilidade", "1", "N"],
  ["usuario", "inventario", "1", "N"], ["carta", "inventario", "1", "N"], ["usuario", "deck", "1", "N"],
  ["deck", "deck_carta", "1", "N"], ["carta", "deck_carta", "1", "N"], ["usuario", "correio", "1", "N"],
  ["usuario", "log_admin", "1", "N"], ["banner", "banner_carta", "1", "N"], ["carta", "banner_carta", "1", "N"],
  ["banner", "banner_rotacao", "1", "N"], ["usuario", "banner_coleta", "1", "N"], ["banner", "banner_coleta", "1", "N"],
  ["usuario", "log_gacha", "1", "N"], ["banner", "log_gacha", "1", "N"], ["carta", "log_gacha", "1", "N"],
  ["usuario", "ledger", "1", "N"], ["usuario", "transacao", "1", "N"], ["pacote", "transacao", "1", "N"],
  ["usuario", "expedicao", "1", "N"], ["deck", "expedicao", "1", "N"], ["expedicao", "log_partida", "1", "N"],
  ["usuario", "log_partida", "1", "N"], ["deck", "log_partida", "1", "N"], ["log_partida", "partida_carta", "1", "N"],
  ["carta", "partida_carta", "1", "N"], ["log_partida", "evento_partida", "1", "N"],
];

const escapeXml = value => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
const byId = Object.fromEntries(entities.map(entity => [entity.id, entity]));
const boxW = 260;
const headerH = 38;
const rowH = 24;
const boxH = entity => headerH + entity.fields.length * rowH + 10;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600" viewBox="0 0 2400 1600">`;
svg += `<rect width="2400" height="1600" fill="#ffffff"/>`;
svg += `<text x="1200" y="42" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">Modelo de Dados Relacional Atualizado</text>`;

for (const group of groups) {
  svg += `<rect x="${group.x}" y="${group.y}" width="${group.w}" height="${group.h}" fill="#fffed2" stroke="#111" stroke-width="3"/>`;
  svg += `<rect x="${group.x + 12}" y="${group.y - 16}" width="${Math.max(230, group.title.length * 12)}" height="30" fill="#fffed2" stroke="#111" stroke-width="3"/>`;
  svg += `<text x="${group.x + 24}" y="${group.y + 5}" font-family="Arial" font-size="18" font-weight="700">${escapeXml(group.title)}</text>`;
}

for (const [fromId, toId, fromCard, toCard] of links) {
  const from = byId[fromId];
  const to = byId[toId];
  const x1 = from.x + boxW / 2;
  const y1 = from.y + boxH(from) / 2;
  const x2 = to.x + boxW / 2;
  const y2 = to.y + boxH(to) / 2;
  svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#5b6470" stroke-width="2"/>`;
  svg += `<text x="${x1 + (x2 - x1) * 0.16}" y="${y1 + (y2 - y1) * 0.16 - 5}" font-family="Arial" font-size="15" fill="#111">${fromCard}</text>`;
  svg += `<text x="${x1 + (x2 - x1) * 0.84}" y="${y1 + (y2 - y1) * 0.84 - 5}" font-family="Arial" font-size="15" fill="#111">${toCard}</text>`;
}

for (const entity of entities) {
  const height = boxH(entity);
  svg += `<rect x="${entity.x}" y="${entity.y}" width="${boxW}" height="${height}" rx="4" fill="#ffffcc" stroke="#111" stroke-width="2"/>`;
  svg += `<rect x="${entity.x}" y="${entity.y}" width="${boxW}" height="${headerH}" rx="4" fill="#fff4a8" stroke="#111" stroke-width="2"/>`;
  svg += `<text x="${entity.x + boxW / 2}" y="${entity.y + 25}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700">${escapeXml(entity.title)}</text>`;
  entity.fields.forEach((field, index) => {
    const isKey = field.startsWith("PK") || field.startsWith("UQ");
    svg += `<text x="${entity.x + 12}" y="${entity.y + headerH + 22 + index * rowH}" font-family="Arial" font-size="15" ${isKey ? 'font-weight="700"' : ""}>${escapeXml(field)}</text>`;
  });
}

svg += `<text x="2380" y="1580" text-anchor="end" font-family="Arial" font-size="14" fill="#555">Fonte: schema.prisma do projeto AnimeCards</text>`;
svg += `</svg>`;

fs.writeFileSync(svgPath, svg, "utf8");
sharp(Buffer.from(svg)).png().toFile(pngPath).then(() => {
  process.stdout.write(`${svgPath}\n${pngPath}\n`);
});
