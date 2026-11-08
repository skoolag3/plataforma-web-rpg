"use client";

import { Check, Layers, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CartaMontada } from "../../../components/cartaMontada";
import type { AdminCarta } from "../../../lib/admin";
import styles from "../../../styles/admin/modalCartasBanner.module.css";

type Props = {
  raridade: { codigo: string; nome: string; cor: string };
  cartas: AdminCarta[];
  selecionadas: Set<string>;
  onFechar: () => void;
  onAplicar: (ids: Set<string>) => void;
};

export function ModalCartasBanner({ raridade, cartas, selecionadas, onFechar, onAplicar }: Props) {
  const [busca, setBusca] = useState("");
  const [rascunho, setRascunho] = useState(() => new Set(selecionadas));
  const cartasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return cartas.filter((carta) => carta.nome.toLocaleLowerCase("pt-BR").includes(termo))
      .sort((a, b) => Number(rascunho.has(b.id)) - Number(rascunho.has(a.id)) || a.nome.localeCompare(b.nome, "pt-BR"));
  }, [busca, cartas, rascunho]);

  useEffect(() => {
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [onFechar]);

  function alternarCarta(idCarta: string) {
    setRascunho((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(idCarta)) proximas.delete(idCarta);
      else proximas.add(idCarta);
      return proximas;
    });
  }

  return createPortal(
    <div className={styles.fundo} onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onFechar(); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-cartas-banner" style={{ "--corRaridade": raridade.cor } as React.CSSProperties}>
        <header className={styles.topo}>
          <div>
            <small>Cartas do banner</small>
            <h3 id="titulo-cartas-banner">Selecionar {raridade.nome}</h3>
            <p>Escolha as cartas que podem aparecer quando esta raridade for sorteada.</p>
          </div>
          <button type="button" className={styles.fechar} aria-label="Fechar seleção de cartas" onClick={onFechar}><X aria-hidden="true" /></button>
        </header>

        <div className={styles.controles}>
          <label className={styles.busca}>
            <Search aria-hidden="true" />
            <input autoFocus type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar carta pelo nome..." aria-label={`Buscar cartas ${raridade.nome}`} />
          </label>
          <span className={styles.contador}>{rascunho.size} {rascunho.size === 1 ? "selecionada" : "selecionadas"}</span>
        </div>

        <div className={styles.lista}>
          {cartasFiltradas.map((carta) => {
            const selecionada = rascunho.has(carta.id);
            return <button key={carta.id} type="button" className={styles.carta} aria-pressed={selecionada} aria-label={`${selecionada ? "Remover" : "Selecionar"} ${carta.nome}`} onClick={() => alternarCarta(carta.id)}>
              <span className={styles.visual}>
                <CartaMontada arte={carta.foto ?? undefined} moldura={carta.moldura ?? undefined} nome={carta.nome} raridade={carta.raridade} elemento={carta.elemento} config={carta.configVisual ?? undefined} placeholder={<Layers aria-hidden="true" />} />
                <span className={styles.marca} aria-hidden="true">{selecionada ? <Check /> : null}</span>
              </span>
            </button>;
          })}
          {!cartas.length ? <p className={styles.vazio}>Não há cartas ativas dessa raridade para selecionar.</p> : null}
          {cartas.length > 0 && !cartasFiltradas.length ? <p className={styles.vazio}>Nenhuma carta encontrada para “{busca}”.</p> : null}
        </div>

        <footer className={styles.rodape}>
          <button type="button" onClick={onFechar}>Cancelar</button>
          <button type="button" className={styles.aplicar} onClick={() => onAplicar(rascunho)}>Confirmar seleção</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
