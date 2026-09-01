import {
  Heart,
  PackagePlus,
  Search,
  Shield,
  Star,
  Swords,
  Wand2,
} from "lucide-react";

import { CartaMontada } from "../../../components/cartaMontada";
import { cardStyle } from "../cardData";
import { styles } from "../styles";
import type { Card } from "../types";

type DetalheCartaProps = {
  carta?: Card;
  favorita: boolean;
  detalhesAbertos: boolean;
  aoAlternarFavorita: () => void;
  aoAlternarDetalhes: () => void;
  aoAdicionarAoDeck: () => void;
};

export function DetalheCarta({
  carta,
  favorita,
  detalhesAbertos,
  aoAlternarFavorita,
  aoAlternarDetalhes,
  aoAdicionarAoDeck,
}: DetalheCartaProps) {
  if (!carta) {
    return (
      <aside className={styles.detalhe} aria-label="Detalhe da carta">
        <div className={styles.detalheVazio}>
          <span>
            <PackagePlus aria-hidden="true" />
          </span>
          <h2>Selecione uma carta</h2>
          <p>
            Clique em uma carta do inventário para ver os detalhes e adicioná-la
            ao deck.
          </p>
        </div>
      </aside>
    );
  }

  const Elemento = carta.elementoIcone;

  return (
    <aside className={styles.detalhe} aria-label="Detalhe da carta">
      <div className={styles.detalheTopo}>
        <article className={styles.cardGrande} style={cardStyle(carta)}>
          {carta.foto || carta.moldura ? (
            <CartaMontada
              arte={carta.foto ?? undefined}
              moldura={carta.moldura ?? undefined}
              nome={carta.nome}
              raridade={carta.raridade}
              elemento={carta.elemento}
              config={carta.configVisual ?? undefined}
              placeholder={<PackagePlus />}
            />
          ) : (
            <>
              <span className={styles.arte} aria-hidden="true" />
              <span className={styles.raridade}>{carta.raridade}</span>
              <span className={styles.elemento}>
                <Elemento aria-label={carta.elemento} />
              </span>
            </>
          )}
        </article>

        <div className={styles.detalheTitulo}>
          <button
            type="button"
            className={[
              styles.favoritoIcone,
              favorita ? styles.favoritoAtivo : "",
            ].join(" ")}
            onClick={aoAlternarFavorita}
            aria-pressed={favorita}
            aria-label="Alternar favorita"
          >
            <Star aria-hidden="true" />
          </button>
          <h2>{carta.nome}</h2>
          <div className={styles.estrelas} aria-label="5 estrelas">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} aria-hidden="true" />
            ))}
          </div>

          <div className={styles.tags}>
            <span className={[styles.tag, styles.tagVerde].join(" ")}>
              <Elemento aria-hidden="true" />
              {carta.elemento}
            </span>
            <span className={[styles.tag, styles.tagRoxo].join(" ")}>
              <Wand2 aria-hidden="true" />
              {carta.classe}
            </span>
          </div>

          <div className={styles.atributos}>
            <span className={styles.atributo}>
              <Heart className={styles.verde} aria-hidden="true" />
              HP
              <strong className={styles.verde}>{carta.hpBase ?? 0}</strong>
            </span>
            <span className={styles.atributo}>
              <Swords className={styles.vermelho} aria-hidden="true" />
              ATK
              <strong className={styles.vermelho}>{carta.danoBase ?? 0}</strong>
            </span>
            <span className={styles.atributo}>
              <Shield className={styles.azul} aria-hidden="true" />
              DEF
              <strong className={styles.azul}>{carta.defesaBase ?? 0}</strong>
            </span>
          </div>
        </div>
      </div>

      <section className={styles.secaoDetalhe}>
        <h3>Passiva</h3>
        <div className={styles.passiva}>
          <span className={styles.passivaIcone}>
            <Elemento aria-hidden="true" />
          </span>
          <p>
            <strong>
              {typeof carta.passiva?.nome === "string"
                ? carta.passiva.nome
                : "Sem passiva cadastrada"}
            </strong>
            {typeof carta.passiva?.descricao === "string"
              ? carta.passiva.descricao
              : "Esta carta ainda não possui uma descrição de passiva."}
          </p>
        </div>
      </section>

      <section className={styles.secaoDetalhe}>
        <h3>Descrição</h3>
        <p>
          Carta de raridade {carta.raridade} ligada ao elemento {carta.elemento}{" "}
          e à classe {carta.classe}.
        </p>
      </section>

      <section className={styles.secaoDetalhe}>
        <h3>Obtido em</h3>
        <p>Gacha</p>
      </section>

      {detalhesAbertos ? (
        <section className={styles.detalhesExtras}>
          <strong>Detalhes completos</strong>
          <span>Cópias: {carta.copias}</span>
          <span>Classe: {carta.classe}</span>
          <span>Status: {carta.obtida ? "Obtida" : "Não obtida"}</span>
        </section>
      ) : null}

      <div className={styles.acoesDetalhe}>
        <button
          className={styles.botaoPrimario}
          type="button"
          onClick={aoAdicionarAoDeck}
          disabled={!carta.obtida}
        >
          <PackagePlus aria-hidden="true" />
          {carta.obtida ? "Adicionar a um deck" : "Carta não obtida"}
        </button>
        <button
          className={styles.botaoSecundario}
          type="button"
          onClick={aoAlternarDetalhes}
        >
          <Search aria-hidden="true" />
          {detalhesAbertos ? "Ocultar detalhes" : "Ver detalhes completos"}
        </button>
      </div>
    </aside>
  );
}
