import type { CaminhoCampanha, SecaoCampanha } from "../../lib/admin";

const dificuldades = ["FACIL", "MEDIA", "DIFICIL"] as const;
const ganhosIniciais = { FACIL: 20, MEDIA: 35, DIFICIL: 50 };

export function novoCaminho(dificuldade: CaminhoCampanha["dificuldade"] = "MEDIA"): CaminhoCampanha {
  return { dificuldade, recompensa: ganhosIniciais[dificuldade], cartas: [], quantidadeCartas: 3, modoCartas: "ALEATORIO", mixed: false };
}

function novaEtapa(grupo: number): SecaoCampanha {
  return { tipo: "BATALHA", grupo, caminhos: dificuldades.map(novoCaminho) };
}

export function secoesIniciais(): SecaoCampanha[] {
  return [novaEtapa(1), novaEtapa(1), novaEtapa(2), { tipo: "BOSS" }];
}

export function grupoDaEtapa(secao: SecaoCampanha, indice: number) {
  return secao.tipo === "BATALHA" ? secao.grupo ?? (indice < 2 ? 1 : indice) : null;
}

function indicesDoGrupo(secoes: SecaoCampanha[], grupo: number) {
  return secoes.flatMap((secao, indice) => grupoDaEtapa(secao, indice) === grupo ? [indice] : []);
}

function proximoGrupoDisponivel(secoes: SecaoCampanha[]) {
  const idsEmUso = new Set(secoes.map(grupoDaEtapa).filter((id) => id !== null));
  return Array.from({ length: 8 }, (_, indice) => indice + 1).find((id) => !idsEmUso.has(id));
}

export function incluirEtapaNoGrupo(secoes: SecaoCampanha[], grupo: number): SecaoCampanha[] {
  const indices = indicesDoGrupo(secoes, grupo);
  if (!indices.length) return secoes;
  const proximaEtapa = indices.at(-1)! + 1;
  if (secoes[proximaEtapa]?.tipo === "BATALHA") {
    const percentualMantidoDerrota = (secoes[indices[0]] as Extract<SecaoCampanha, { tipo: "BATALHA" }>).percentualMantidoDerrota;
    return secoes.map((secao, indice) => {
      if (indice !== proximaEtapa || secao.tipo !== "BATALHA") return secao;
      const proxima = { ...secao, grupo };
      if (percentualMantidoDerrota === undefined) delete proxima.percentualMantidoDerrota;
      else proxima.percentualMantidoDerrota = percentualMantidoDerrota;
      return proxima;
    });
  }
  if (secoes.length >= 8 || secoes.at(-1)?.tipo !== "BOSS") return secoes;
  return [...secoes.slice(0, -1), novaEtapa(grupo), { tipo: "BOSS" }];
}

export function separarUltimaEtapa(secoes: SecaoCampanha[], grupo: number): SecaoCampanha[] {
  const indices = indicesDoGrupo(secoes, grupo);
  const novoGrupo = proximoGrupoDisponivel(secoes);
  if (indices.length < 2 || !novoGrupo) return secoes;
  const ultimaEtapa = indices.at(-1)!;
  return secoes.map((secao, indice) => indice === ultimaEtapa && secao.tipo === "BATALHA"
    ? { ...secao, grupo: novoGrupo } : secao);
}

export function adicionarGrupo(secoes: SecaoCampanha[]) {
  const grupo = proximoGrupoDisponivel(secoes);
  if (!grupo || secoes.length >= 8 || secoes.at(-1)?.tipo !== "BOSS") return null;
  return { grupo, secoes: [...secoes.slice(0, -1), novaEtapa(grupo), { tipo: "BOSS" } as const] };
}

export function removerEtapa(secoes: SecaoCampanha[], indice: number): SecaoCampanha[] {
  if (secoes.length <= 2 || secoes[indice]?.tipo !== "BATALHA") return secoes;
  return secoes.filter((_, atual) => atual !== indice);
}
