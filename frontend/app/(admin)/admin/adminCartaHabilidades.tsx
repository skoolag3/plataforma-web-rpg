import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  listarAdminHabilidades,
  type AdminCartaHabilidade,
  type AdminHabilidade,
} from "../../lib/admin";
import styles from "./adminCartaHabilidades.module.css";

type HabilidadeExibida = AdminHabilidade | AdminCartaHabilidade;

type Props = {
  selecionadasIds: string[];
  habilidadesIniciais?: AdminCartaHabilidade[];
  aoAlterar: (ids: string[]) => void;
};

const limiteHabilidades = 3;

export function AdminCartaHabilidades({
  selecionadasIds,
  habilidadesIniciais = [],
  aoAlterar,
}: Props) {
  const [habilidades, setHabilidades] = useState<AdminHabilidade[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarAdminHabilidades()
      .then((res) => {
        if (ativo) setHabilidades(res);
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as habilidades.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const todas = useMemo(() => {
    const mapa = new Map<string, HabilidadeExibida>();
    habilidadesIniciais.forEach((habilidade) =>
      mapa.set(habilidade.id, habilidade),
    );
    habilidades.forEach((habilidade) => mapa.set(habilidade.id, habilidade));
    return mapa;
  }, [habilidades, habilidadesIniciais]);

  const selecionadas = selecionadasIds.reduce<HabilidadeExibida[]>(
    (lista, id) => {
      const habilidade = todas.get(id);
      if (habilidade) lista.push(habilidade);
      return lista;
    },
    [],
  );
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const catalogo = habilidades.filter(
    (habilidade) =>
      habilidade.status === "PUBLICADA" &&
      !selecionadasIds.includes(habilidade.id) &&
      (!termo ||
        [habilidade.nome, habilidade.tipoEfeito, habilidade.gatilho].some(
          (valor) => valor.toLocaleLowerCase("pt-BR").includes(termo),
        )),
  );

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= selecionadasIds.length) return;
    const ids = [...selecionadasIds];
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    aoAlterar(ids);
  }

  return (
    <section className={styles.painel}>
      <header className={styles.topo}>
        <div>
          <strong>Habilidades da carta</strong>
          <small>Somente versões publicadas podem ser vinculadas.</small>
        </div>
        <span className={styles.contador}>
          {selecionadasIds.length}/{limiteHabilidades}
        </span>
      </header>

      {selecionadas.length ? (
        <div className={styles.selecionadas}>
          {selecionadas.map((habilidade, indice) => (
            <article key={habilidade.id}>
              <span className={styles.ordem}>{indice + 1}</span>
              <div className={styles.dados}>
                <strong>{habilidade.nome}</strong>
                <small
                  className={
                    habilidade.status !== "PUBLICADA"
                      ? styles.indisponivel
                      : undefined
                  }
                >
                  {habilidade.tipoEfeito} · {habilidade.gatilho} · v
                  {habilidade.versao}
                  {habilidade.status !== "PUBLICADA"
                    ? " · remova antes de salvar"
                    : ""}
                </small>
              </div>
              <div className={styles.acoes}>
                <button
                  type="button"
                  onClick={() => mover(indice, -1)}
                  disabled={indice === 0}
                  aria-label={`Subir ${habilidade.nome}`}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(indice, 1)}
                  disabled={indice === selecionadas.length - 1}
                  aria-label={`Descer ${habilidade.nome}`}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    aoAlterar(
                      selecionadasIds.filter((id) => id !== habilidade.id),
                    )
                  }
                  aria-label={`Remover ${habilidade.nome}`}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <span className={styles.estado}>Nenhuma habilidade selecionada.</span>
      )}

      <label className={styles.busca}>
        <Search aria-hidden="true" />
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar habilidade publicada..."
        />
      </label>

      {erro ? <span className={styles.estado}>{erro}</span> : null}
      {carregando ? (
        <span className={styles.estado}>Carregando habilidades...</span>
      ) : (
        <div className={styles.catalogo}>
          {catalogo.map((habilidade) => (
            <article key={habilidade.id}>
              <span className={styles.ordem}>+</span>
              <div className={styles.dados}>
                <strong>{habilidade.nome}</strong>
                <small>
                  {habilidade.tipoEfeito} · {habilidade.gatilho} · v
                  {habilidade.versao}
                </small>
              </div>
              <button
                type="button"
                onClick={() => aoAlterar([...selecionadasIds, habilidade.id])}
                disabled={selecionadasIds.length >= limiteHabilidades}
                aria-label={`Adicionar ${habilidade.nome}`}
              >
                <Plus aria-hidden="true" />
              </button>
            </article>
          ))}
          {!catalogo.length ? (
            <span className={styles.estado}>
              Nenhuma habilidade publicada disponível.
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
