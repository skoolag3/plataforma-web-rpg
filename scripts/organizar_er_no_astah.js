"use strict";

const endpoint = "http://127.0.0.1:3099/mcp";
const positions = {
  usuario: [80, 80], perfil_usuario: [420, 80], provedor_usuario: [760, 80], moldura: [1100, 80],
  usuario_moldura: [1440, 80], solicitacao_exclusao: [1780, 80], correio_leitura: [2120, 80],

  classe_carta: [80, 390], carta: [420, 390], habilidade: [760, 390], carta_habilidade: [1100, 390],
  inventario: [1440, 390], deck: [1780, 390], deck_carta: [2120, 390],

  banner: [80, 700], banner_carta: [420, 700], banner_rotacao: [760, 700], usuario_banner_coleta: [1100, 700],
  log_gacha: [1440, 700], ledger_ruby: [1780, 700], pacote_ruby: [2120, 700], log_transacao: [2460, 700],

  expedicao: [80, 1050], log_partida: [420, 1050], partida_carta: [760, 1050], evento_partida: [1100, 1050],
  noticia: [1440, 1050], log_admin_usuario: [1780, 1050],
};

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
  const response = await post({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  const result = response.result;
  if (result?.isError) throw new Error(`${name}: ${result.content?.map(item => item.text).join(" ")}`);
  const text = result?.content?.find(item => item.type === "text")?.text;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  await post({ jsonrpc: "2.0", id: requestId, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "codex-er-layout", version: "1.0" } } }, false);
  await post({ jsonrpc: "2.0", method: "notifications/initialized" });

  const current = await callTool("getCurrentDiagram");
  if (!current?.erdiagram || !current.qualifiedName.endsWith("Modelo de Dados Relacional Atualizado")) {
    throw new Error("O diagrama E/R atualizado não está aberto no Astah.");
  }

  const presentations = await callTool("getPresentationModelsInCurrentDiagram");
  let moved = 0;
  let adjustedLines = 0;
  for (const item of presentations) {
    const type = item.presentation?.type;
    const label = item.label ?? item.presentation?.label;
    if (type === "EREntity" && positions[label]) {
      const [x, y] = positions[label];
      await callTool("setPresentationLocation", { modelId: item.id, x, y });
      moved += 1;
    } else if (type && type.includes("Relationship")) {
      await callTool("setLineShape", { modelId: item.id, shape: "line" });
      adjustedLines += 1;
    }
  }

  await callTool("saveProject");
  const finalPresentations = await callTool("getPresentationModelsInCurrentDiagram");
  const entityCounts = {};
  for (const item of finalPresentations) {
    if (item.presentation?.type === "EREntity") {
      const label = item.label ?? item.presentation?.label;
      entityCounts[label] = (entityCounts[label] ?? 0) + 1;
    }
  }
  const duplicates = Object.entries(entityCounts).filter(([, count]) => count > 1);
  process.stdout.write(`entidades_movidas=${moved}\nlinhas_ajustadas=${adjustedLines}\nSALVO ${current.qualifiedName}\n`);
  process.stdout.write(`duplicadas=${JSON.stringify(duplicates)}\n`);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
