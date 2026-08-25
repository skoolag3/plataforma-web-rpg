"use client";

import { Layers, Minus, PackagePlus, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CartaMontada } from "../../components/cartaMontada";
import type { AdminUsuarioCarta } from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminUsuarios.module.css";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, featureStyles);

type Props = {
  colecao: AdminUsuarioCarta[];
  carregando: boolean;
  salvando: boolean;
  onAjustar: (carta: AdminUsuarioCarta, quantidade: number) => Promise<void>;
};

function correspondeBusca(carta: AdminUsuarioCarta, busca: string) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  if (!termo) return true;
  return [carta.nome, carta.raridade, carta.elemento].some((campo) =>
    campo.toLocaleLowerCase("pt-BR").includes(termo),
  );
}

function VisualCarta({ carta }: { carta: AdminUsuarioCarta }) {
  return (
    <CartaMontada
      arte={carta.foto ?? undefined}
      moldura={carta.moldura ?? undefined}
      config={carta.configVisual ?? undefined}
      placeholder={<Layers aria-hidden="true" />}
    >
      <span className={styles.usuarioCartaInfo}>
        <span><b>{carta.raridade}</b><small>{carta.elemento}</small></span>
        <strong>{carta.nome}</strong>
      </span>
    </CartaMontada>
  );
}

export function AdminUsuarioColecao({
  colecao,
  carregando,
  salvando,
  onAjustar,
}: Props) {
  const [busca, setBusca] = useState("");
  const [buscaCatalogo, setBuscaCatalogo] = useState("");
  const [catalogoAberto, setCatalogoAberto] = useState(false);

  const obtidas = useMemo(
    () => colecao.filter((carta) => carta.quantidade > 0 && correspondeBusca(carta, busca)),
    [busca, colecao],
  );
  const catalogo = useMemo(
    () => colecao.filter((carta) => correspondeBusca(carta, buscaCatalogo)),
    [buscaCatalogo, colecao],
  );
  const totalCartas = colecao.reduce((total, carta) => total + carta.quantidade, 0);

  if (catalogoAberto) {
    return (
      <section className={styles.usuarioCatalogo} aria-label="Adicionar carta à coleção">
        <header>
          <div><small>Catálogo completo</small><h3>Adicionar carta</h3></div>
          <button type="button" onClick={() => setCatalogoAberto(false)} aria-label="Fechar catálogo"><X /></button>
        </header>
        <label className={styles.usuarioBuscaCarta}><Search /><input value={buscaCatalogo} onChange={(event) => setBuscaCatalogo(event.target.value)} placeholder="Buscar por nome, raridade ou elemento" /></label>
        <div className={styles.usuarioCatalogoGrid}>
          {catalogo.map((carta) => (
            <article key={carta.id}>
              <div className={styles.usuarioCatalogoVisual}><VisualCarta carta={carta} /></div>
              <div><strong>{carta.nome}</strong><small>{carta.quantidade ? `${carta.quantidade} no inventário` : "Ainda não possui"}</small></div>
              <button type="button" disabled={salvando} onClick={() => void onAjustar(carta, 1)}><Plus /> Adicionar</button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.usuarioInventario}>
      <header className={styles.usuarioInventarioTopo}>
        <div><small>Inventário do usuário</small><h3>{totalCartas} cartas · {colecao.filter((carta) => carta.quantidade > 0).length} diferentes</h3></div>
        <button type="button" className={styles.primaryBtn} onClick={() => setCatalogoAberto(true)}><PackagePlus /> Adicionar carta</button>
      </header>

      <label className={styles.usuarioBuscaCarta}><Search /><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar no inventário" /></label>
      {carregando ? <p className={styles.feedbackInfo}>Carregando inventário...</p> : null}

      {!carregando && !obtidas.length ? (
        <div className={styles.usuarioInventarioVazio}>
          <Layers />
          <strong>{busca ? "Nenhuma carta encontrada" : "Inventário vazio"}</strong>
          <p>{busca ? "Tente outro termo de busca." : "Este usuário ainda não possui cartas."}</p>
          {!busca ? <button type="button" onClick={() => setCatalogoAberto(true)}><Plus /> Adicionar primeira carta</button> : null}
        </div>
      ) : (
        <div className={styles.usuarioInventarioGrid}>
          {obtidas.map((carta) => (
            <article key={carta.id} className={styles.usuarioInventarioCarta}>
              <div className={styles.usuarioInventarioVisual}><VisualCarta carta={carta} /></div>
              <footer>
                <span><small>Quantidade</small><strong>x{carta.quantidade}</strong></span>
                <button type="button" disabled={salvando} onClick={() => void onAjustar(carta, -1)} aria-label={`Remover uma cópia de ${carta.nome}`}><Minus /> Remover</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
