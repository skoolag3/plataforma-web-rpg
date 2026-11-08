import assert from "node:assert/strict";
import test from "node:test";

import { formularioCartaAlterado } from "../app/(admin)/admin/cartas/adminCartaEditor.estado.ts";

const formulario = {
  nome: "Raika, Lâmina do Eclipse",
  raridade: "SSR",
  elemento: "sombra",
  habilidadesIds: ["habilidade-1", "habilidade-2"],
  configVisual: { arte: { escala: 1 } },
};

test("formulário salvo sem nova edição não fica marcado como alterado", () => {
  assert.equal(formularioCartaAlterado(formulario, formulario, false), false);
});

test("arquivo pendente mantém o formulário marcado como alterado", () => {
  assert.equal(formularioCartaAlterado(formulario, formulario, true), true);
});

test("nova edição após salvar volta a marcar o formulário", () => {
  const salvo = structuredClone(formulario);
  const editado = { ...formulario, nome: "Raika" };

  assert.equal(formularioCartaAlterado(editado, salvo, false), true);
});
