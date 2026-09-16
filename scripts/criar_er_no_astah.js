"use strict";

const endpoint = "http://127.0.0.1:3099/mcp";

const entities = [
  ["usuario", [["id","UUID",true,false],["nome","VARCHAR",false,false],["email","VARCHAR",false,false],["is_admin","BOOLEAN",false,false],["saldo_rubys_cache","INTEGER",false,false]]],
  ["perfil_usuario", [["id_usuario","UUID",true,true],["id_moldura","UUID",false,true],["id_carta_moldura","UUID",false,true],["avatar_url","VARCHAR",false,false],["mostrar_no_ranking","BOOLEAN",false,false]]],
  ["provedor_usuario", [["id","UUID",true,false],["id_usuario","UUID",false,true],["provedor","VARCHAR",false,false],["id_provedor","VARCHAR",false,false]]],
  ["moldura", [["id","UUID",true,false],["slug","VARCHAR",false,false],["nome","VARCHAR",false,false],["classe_css","VARCHAR",false,false]]],
  ["usuario_moldura", [["id_usuario","UUID",true,true],["id_moldura","UUID",true,true],["obtido_em","TIMESTAMP",false,false]]],
  ["solicitacao_exclusao", [["id","UUID",true,false],["id_usuario","UUID",false,true],["status","VARCHAR",false,false],["executar_apos","TIMESTAMP",false,false]]],
  ["correio_leitura", [["id_usuario","UUID",true,true],["chave","VARCHAR",true,false],["lido_em","TIMESTAMP",false,false]]],
  ["log_admin_usuario", [["id","UUID",true,false],["id_admin","UUID",false,true],["id_usuario","UUID",false,true],["acao","VARCHAR",false,false],["detalhes","JSON",false,false]]],
  ["carta", [["id","UUID",true,false],["id_classe","UUID",false,true],["nome","VARCHAR",false,false],["raridade","VARCHAR",false,false],["hp_base","INTEGER",false,false],["dano_base","INTEGER",false,false],["defesa_base","INTEGER",false,false]]],
  ["classe_carta", [["id","UUID",true,false],["nome","VARCHAR",false,false],["prioridade_ataque","INTEGER",false,false],["modificador_hp","INTEGER",false,false],["modificador_ataque","INTEGER",false,false],["modificador_defesa","INTEGER",false,false]]],
  ["habilidade", [["id","UUID",true,false],["nome","VARCHAR",false,false],["gatilho","VARCHAR",false,false],["tipo_efeito","VARCHAR",false,false],["alvo","VARCHAR",false,false],["status","VARCHAR",false,false]]],
  ["carta_habilidade", [["id_carta","UUID",true,true],["id_habilidade","UUID",true,true],["ordem","INTEGER",false,false]]],
  ["inventario", [["id","UUID",true,false],["id_usuario","UUID",false,true],["id_carta","UUID",false,true],["quantidade","INTEGER",false,false]]],
  ["deck", [["id","UUID",true,false],["id_usuario","UUID",false,true],["nome","VARCHAR",false,false],["ativo","BOOLEAN",false,false]]],
  ["deck_carta", [["id_deck","UUID",true,true],["id_carta","UUID",true,true],["posicao_slot","INTEGER",false,false]]],
  ["banner", [["id","UUID",true,false],["nome","VARCHAR",false,false],["custo_giro","INTEGER",false,false],["ativo","BOOLEAN",false,false]]],
  ["banner_carta", [["id_banner","UUID",true,true],["id_carta","UUID",true,true],["taxa_drop","DECIMAL",false,false]]],
  ["banner_rotacao", [["id","INTEGER",true,false],["id_banner","UUID",false,true],["proxima_rotacao_em","TIMESTAMP",false,false],["forcado_por_admin","BOOLEAN",false,false]]],
  ["usuario_banner_coleta", [["id_usuario","UUID",true,true],["id_banner","UUID",true,true],["ultima_coleta","TIMESTAMP",false,false]]],
  ["log_gacha", [["id","UUID",true,false],["id_usuario","UUID",false,true],["id_banner","UUID",false,true],["id_carta_obtida","UUID",false,true],["pity_contador","INTEGER",false,false]]],
  ["ledger_ruby", [["id","UUID",true,false],["id_usuario","UUID",false,true],["quantidade","INTEGER",false,false],["motivo","VARCHAR",false,false],["id_referencia","UUID",false,false]]],
  ["pacote_ruby", [["id","UUID",true,false],["id_stripe","VARCHAR",false,false],["quantidade_rubys","INTEGER",false,false],["preco_brl","DECIMAL",false,false]]],
  ["log_transacao", [["id","UUID",true,false],["id_usuario","UUID",false,true],["id_pacote","UUID",false,true],["status_pagamento","VARCHAR",false,false]]],
  ["expedicao", [["id","UUID",true,false],["id_usuario","UUID",false,true],["id_deck","UUID",false,true],["seed","INTEGER",false,false],["status","VARCHAR",false,false],["trilha","JSON",false,false]]],
  ["log_partida", [["id","UUID",true,false],["id_usuario","UUID",false,true],["id_deck_usado","UUID",false,true],["id_expedicao","UUID",false,true],["resultado","VARCHAR",false,false],["recompensa_rubys","INTEGER",false,false]]],
  ["partida_carta", [["id","UUID",true,false],["id_partida","UUID",false,true],["id_carta","UUID",false,true],["lado","VARCHAR",false,false],["posicao","INTEGER",false,false],["hp_atual","INTEGER",false,false]]],
  ["evento_partida", [["id","UUID",true,false],["id_partida","UUID",false,true],["sequencia","INTEGER",false,false],["turno","INTEGER",false,false],["tipo","VARCHAR",false,false]]],
  ["noticia", [["id","UUID",true,false],["titulo","VARCHAR",false,false],["categoria","VARCHAR",false,false],["imagem","VARCHAR",false,false],["publicada","BOOLEAN",false,false]]],
];

const relations = [
  ["usuario","perfil_usuario","0..1"],["usuario","provedor_usuario","0..*"],["usuario","usuario_moldura","0..*"],["moldura","usuario_moldura","0..*"],["moldura","perfil_usuario","0..*"],["carta","perfil_usuario","0..*"],["usuario","solicitacao_exclusao","0..*"],["usuario","correio_leitura","0..*"],["usuario","log_admin_usuario","0..*"],
  ["classe_carta","carta","0..*"],["carta","carta_habilidade","0..*"],["habilidade","carta_habilidade","0..*"],["usuario","inventario","0..*"],["carta","inventario","0..*"],["usuario","deck","0..*"],["deck","deck_carta","0..*"],["carta","deck_carta","0..*"],
  ["banner","banner_carta","1..*"],["carta","banner_carta","0..*"],["banner","banner_rotacao","0..*"],["usuario","usuario_banner_coleta","0..*"],["banner","usuario_banner_coleta","0..*"],["usuario","log_gacha","0..*"],["banner","log_gacha","0..*"],["carta","log_gacha","0..*"],["usuario","ledger_ruby","0..*"],["usuario","log_transacao","0..*"],["pacote_ruby","log_transacao","0..*"],
  ["usuario","expedicao","0..*"],["deck","expedicao","0..*"],["expedicao","log_partida","0..*"],["usuario","log_partida","0..*"],["deck","log_partida","0..*"],["log_partida","partida_carta","1..*"],["carta","partida_carta","0..*"],["log_partida","evento_partida","0..*"],
];

let sessionId;
let requestId = 1;

function parseResponse(text) {
  if (!text.trim()) return {};
  const dataLine = text.split(/\r?\n/).find(line => line.startsWith("data: "));
  return JSON.parse(dataLine ? dataLine.slice(6) : text);
}

async function post(payload, includeSession = true) {
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (includeSession && sessionId) headers["Mcp-Session-Id"] = sessionId;
  const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!sessionId) sessionId = response.headers.get("mcp-session-id");
  const parsed = parseResponse(await response.text());
  if (parsed.error) throw new Error(JSON.stringify(parsed.error));
  return parsed;
}

async function callTool(name, args = {}) {
  const result = await post({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  const toolResult = result.result;
  if (toolResult?.isError) throw new Error(`${name}: ${toolResult.content?.map(item => item.text).join(" ")}`);
  const text = toolResult?.content?.find(item => item.type === "text")?.text;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const init = await post({ jsonrpc: "2.0", id: requestId, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "codex-er-builder", version: "1.0" } } }, false);
  await post({ jsonrpc: "2.0", method: "notifications/initialized" });

  const diagram = await callTool("getOrCreateERDiagram", { umlDiagram: { qualifiedName: "Modelo de Dados Relacional Atualizado", type: "ER", description: "Modelo E/R atualizado conforme o schema Prisma do AnimeCards" } });
  await callTool("openDiagram", { umlDiagram: diagram });

  const created = {};
  for (const [name, attributes] of entities) {
    const entity = await callTool("getOrCreateEREntityInERDiagram", { umlDiagram: diagram, erEntityDto: { qualifiedName: name, qualifiedPhysicalName: name, entityType: "Resource" } });
    created[name] = entity;
    for (const [attributeName, dataType, primaryKey, foreignKey] of attributes) {
      await callTool("getOrCreateERAttribute", { erAttributeDto: {
        qualifiedName: `${entity.qualifiedName}.${attributeName}`,
        qualifiedPhysicalName: `${name}.${attributeName}`,
        dataType,
        primaryKey,
        foreignKey: false,
        nullable: !primaryKey,
        owner: { id: entity.id, qualifiedName: entity.qualifiedName },
      }});
    }
    process.stdout.write(`entidade ${name}\n`);
  }

  for (const [parentName, childName, childMultiplicity] of relations) {
    const parent = created[parentName];
    const child = created[childName];
    await callTool("getOrCreateERRelationship", { umlDiagram: diagram, erRelationshipDto: {
      qualifiedName: `${parentName}_${childName}`,
      qualifiedPhysicalName: `${parentName}_${childName}`,
      parentEntity: { id: parent.id, qualifiedName: parent.qualifiedName },
      childEntity: { id: child.id, qualifiedName: child.qualifiedName },
      parentMultiplicity: "1",
      childMultiplicity,
      parentRequired: true,
      identifying: false,
      kind: "NON_IDENTIFYING",
    }});
  }

  await callTool("layoutDiagram", { diagramName: diagram.qualifiedName });
  await callTool("saveProject", {});
  process.stdout.write(`SALVO ${diagram.qualifiedName}\n`);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
