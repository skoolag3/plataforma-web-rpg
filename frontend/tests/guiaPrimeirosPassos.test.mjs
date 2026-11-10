import assert from "node:assert/strict";
import test from "node:test";
import { chaveSessaoGuia, obterPassoInicialGuia } from "../app/lib/guiaPrimeirosPassos.estado.ts";

function criarArmazenamento() {
  const dados = new Map();
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: (chave) => dados.delete(chave),
  };
}

test("guia continua na mesma sessão e não reabre após novo login", () => {
  const local = criarArmazenamento();
  const sessao = criarArmazenamento();

  assert.equal(obterPassoInicialGuia("usuario-1", "/home", local, sessao, 5), 0);
  sessao.setItem("animecards_guia_etapa_usuario-1", "2");
  assert.equal(obterPassoInicialGuia("usuario-1", "/banners", local, sessao, 5), 2);

  sessao.removeItem(chaveSessaoGuia);
  assert.equal(obterPassoInicialGuia("usuario-1", "/home", local, sessao, 5), null);
  assert.equal(obterPassoInicialGuia("usuario-2", "/home", local, sessao, 5), 0);
});

test("rota fora do guia não marca o usuário como iniciado", () => {
  const local = criarArmazenamento();
  const sessao = criarArmazenamento();

  assert.equal(obterPassoInicialGuia("usuario-1", "/cartas", local, sessao, 5), null);
  assert.equal(local.getItem("animecards_guia_inicial_usuario-1"), null);
  assert.equal(obterPassoInicialGuia("usuario-1", "/home", local, sessao, 5), 0);
});
