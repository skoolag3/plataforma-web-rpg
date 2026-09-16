"use strict";

const endpoint = "http://127.0.0.1:3099/mcp";
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
  return parseResponse(await response.text());
}

async function callTool(name, args = {}) {
  const response = await post({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  const result = response.result;
  if (result?.isError) throw new Error(result.content?.map(item => item.text).join(" "));
  const text = result?.content?.find(item => item.type === "text")?.text;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  await post({ jsonrpc: "2.0", id: requestId, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "codex-er-inspector", version: "1.0" } } }, false);
  await post({ jsonrpc: "2.0", method: "notifications/initialized" });
  for (const name of ["perfil_usuario", "inventario", "deck", "banner_carta", "log_partida", "expedicao"]) {
    const model = await callTool("getModelByIdOrQualifiedName", { qualifiedName: `ER Model::Default Schema::${name}` });
    process.stdout.write(`### ${name}\n${JSON.stringify(model, null, 2)}\n`);
  }
}

main().catch(error => { console.error(error.stack || error.message); process.exit(1); });
