import assert from "node:assert/strict";
import test from "node:test";
import {
  adicionarGrupo,
  incluirEtapaNoGrupo,
  removerEtapa,
  secoesIniciais,
  separarUltimaEtapa,
} from "../app/(admin)/admin/campanha/adminCampanhaSecoes.estado.ts";

test("separar e juntar uma etapa preserva todos os campos dos caminhos", () => {
  const secoes = secoesIniciais();
  secoes[1].caminhos[0] = {
    dificuldade: "DIFICIL",
    recompensa: 77,
    quantidadeCartas: 4,
    modoCartas: "MANUAL",
    mixed: true,
    cartas: ["carta-a", "carta-b", "carta-c", "carta-d", "carta-e"],
    titulo: "Rota preservada",
    descricao: "Descrição da etapa 2",
  };
  const antes = structuredClone(secoes);

  const separadas = separarUltimaEtapa(secoes, 1);
  assert.equal(separadas[1].grupo, 3);
  assert.deepEqual({ ...separadas[1], grupo: 1 }, antes[1]);
  assert.deepEqual(secoes, antes, "a operação não deve alterar o estado anterior");

  const reunidas = incluirEtapaNoGrupo(separadas, 1);
  assert.deepEqual(reunidas, antes);
  assert.equal(reunidas.at(-1).tipo, "BOSS");
});

test("as etapas iniciais aumentam de uma para três cartas inimigas", () => {
  assert.deepEqual(secoesIniciais().slice(0, 3).map((secao) =>
    secao.caminhos.map((caminho) => caminho.quantidadeCartas)),
  [[1, 1, 1], [2, 2, 2], [3, 3, 3]]);
});

test("inserir, juntar e remover uma etapa conserva as outras", () => {
  const originais = secoesIniciais();
  originais[1].caminhos[2].titulo = "Caminho antigo";
  const insercao = adicionarGrupo(originais);
  assert.ok(insercao);
  assert.equal(insercao.secoes.length, 5);
  assert.equal(insercao.secoes[3].tipo, "BATALHA");
  assert.equal(insercao.secoes[4].tipo, "BOSS");

  const comDados = structuredClone(insercao.secoes);
  comDados[3].caminhos[0].recompensa = 88;
  comDados[3].caminhos[0].titulo = "Nova etapa";
  const reunidas = incluirEtapaNoGrupo(comDados, 2);
  assert.equal(reunidas[3].grupo, 2);
  assert.deepEqual(reunidas[3].caminhos, comDados[3].caminhos);

  const removidas = removerEtapa(reunidas, 3);
  assert.deepEqual(removidas, originais);
  assert.equal(removidas.at(-1).tipo, "BOSS");
});

test("vários ciclos de separar e juntar reutilizam IDs de grupo válidos", () => {
  const originais = secoesIniciais();
  let secoes = originais;
  for (let ciclo = 0; ciclo < 20; ciclo++) {
    secoes = separarUltimaEtapa(secoes, 1);
    assert.ok(secoes[1].grupo >= 1 && secoes[1].grupo <= 8);
    secoes = incluirEtapaNoGrupo(secoes, 1);
  }
  assert.deepEqual(secoes, originais);
});

test("o limite de etapas mantém o boss no fim", () => {
  let secoes = secoesIniciais();
  while (secoes.length < 8) secoes = incluirEtapaNoGrupo(secoes, 2);
  assert.equal(secoes.length, 8);
  assert.equal(secoes.at(-1).tipo, "BOSS");
  assert.strictEqual(incluirEtapaNoGrupo(secoes, 2), secoes);
  assert.equal(adicionarGrupo(secoes), null);
});

test("etapa movida para outra seção usa a perda da seção de destino", () => {
  const secoes = secoesIniciais();
  secoes[0].percentualMantidoDerrota = 60;
  secoes[1].percentualMantidoDerrota = 60;
  secoes[2].percentualMantidoDerrota = 10;
  const reunidas = incluirEtapaNoGrupo(secoes, 1);
  assert.equal(reunidas[2].grupo, 1);
  assert.equal(reunidas[2].percentualMantidoDerrota, 60);
  assert.equal(secoes[2].percentualMantidoDerrota, 10);
});
