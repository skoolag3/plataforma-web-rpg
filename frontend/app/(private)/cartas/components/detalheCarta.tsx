"use client";

import { nomeElementoCarta } from "../../../components/elementosCarta";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import {
  Heart,
  PackagePlus,
  Shield,
  Star,
  Swords,
  X,
} from "lucide-react";

import { CartaMontada } from "../../../components/cartaMontada";
import { obterElementoCarta } from "../../../components/elementosCarta";
import { cardStyle } from "../cardData";
import { styles } from "../styles";
import type { Card } from "../types";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";

type DetalheCartaProps = {
  carta?: Card;
  favorita: boolean;
  aoAlternarFavorita: () => void;
  aoAdicionarAoDeck: () => void;
  aoFechar: () => void;
  modoDeck?: boolean;
  modoResultado?: boolean;
  modoPrevia?: boolean;
  modoBatalha?: boolean;
  modoAdmin?: boolean;
  valorVendaResultado?: number;
};

const vantagemElemento: Record<Card["elemento"], Card["elemento"]> = {
  fogo: "natureza",
  natureza: "agua",
  agua: "fogo",
  luz: "sombra",
  sombra: "luz",
};

export function DetalheCarta({
  carta,
  favorita,
  aoAlternarFavorita,
  aoAdicionarAoDeck,
  aoFechar,
  modoDeck = false,
  modoResultado = false,
  modoPrevia = false,
  modoBatalha = false,
  modoAdmin = false,
  valorVendaResultado = 0,
}: DetalheCartaProps) {
  const raridades = useRaridadesJogo();
  const [dicaAberta, setDicaAberta] = useState<"elemento" | "classe" | null>(null);
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
  const elementoVisual = obterElementoCarta(carta.elemento);
  const vantagem = obterElementoCarta(vantagemElemento[carta.elemento])?.label ?? vantagemElemento[carta.elemento];
  const desvantagemCodigo = (Object.keys(vantagemElemento) as Card["elemento"][])
    .find((elemento) => vantagemElemento[elemento] === carta.elemento);
  const desvantagem = desvantagemCodigo
    ? obterElementoCarta(desvantagemCodigo)?.label ?? desvantagemCodigo
    : "nenhum";
  const nomeRaridade = obterRaridadeJogo(raridades, carta.raridade)?.nome ?? carta.raridade;
  const corRaridade = obterRaridadeJogo(raridades, carta.raridade)?.cor ?? carta.borda;
  const habilidades = carta.habilidades?.length
    ? carta.habilidades
    : [{
        id: "passiva",
        nome: typeof carta.passiva?.nome === "string" ? carta.passiva.nome : "Sem habilidade cadastrada",
        descricao: typeof carta.passiva?.descricao === "string"
          ? carta.passiva.descricao
          : "Esta carta ainda não tem um efeito de combate descrito.",
      }];

  return (
    <aside id="detalhe-carta" className={styles.detalhe} aria-label="Detalhe da carta" style={{ "--cor-raridade": corRaridade } as CSSProperties}>
      <button type="button" className={styles.btnFecharDetalhe} onClick={aoFechar} aria-label="Fechar detalhes da carta" autoFocus>
        <X aria-hidden="true" />
      </button>
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
              <span className={styles.raridade}>{obterRaridadeJogo(raridades, carta.raridade)?.nome ?? carta.raridade}</span>
              <span className={styles.elemento}>
                <Elemento aria-label={nomeElementoCarta(carta.elemento)} />
              </span>
            </>
          )}
        </article>

        <div className={styles.detalheTitulo}>
          <span className={styles.detalheRotulo}>{modoAdmin ? "Prévia administrativa" : modoBatalha ? "Carta em batalha" : modoPrevia ? "Carta do banner" : modoResultado ? "Carta da invocação" : "Carta da coleção"}</span>
          <h2>{carta.nome}</h2>
          <p className={styles.detalheRaridade}>{nomeRaridade}</p>

          <div className={styles.tags} onBlur={(evento) => {
            if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
              setDicaAberta(null);
            }
          }}>
            <span className={styles.tagComDica} data-aberta={dicaAberta === "elemento"}>
              <button
                type="button"
                className={[styles.tag, styles.tagElemento].join(" ")}
                style={{ "--cor-elemento": elementoVisual?.cor ?? "#94a3b8" } as CSSProperties}
                aria-expanded={dicaAberta === "elemento"}
                aria-describedby="dica-elemento-carta"
                onClick={() => setDicaAberta(dicaAberta === "elemento" ? null : "elemento")}
              >
                {elementoVisual ? <Image src={elementoVisual.icone} alt="" width={20} height={20} /> : null}
                {elementoVisual?.label ?? carta.elemento}
              </button>
              <span id="dica-elemento-carta" role="tooltip" className={styles.dicaTag}>
                <strong>Relação elemental</strong>
                <span>Vantagem contra {vantagem}. Desvantagem contra {desvantagem}.</span>
              </span>
            </span>
            <span className={[styles.tagComDica, styles.tagDicaClasse].join(" ")} data-aberta={dicaAberta === "classe"}>
              <button
                type="button"
                className={[styles.tag, styles.tagRoxo].join(" ")}
                aria-expanded={dicaAberta === "classe"}
                aria-describedby="dica-classe-carta"
                onClick={() => setDicaAberta(dicaAberta === "classe" ? null : "classe")}
              >
                {carta.classe}
              </button>
              <span id="dica-classe-carta" role="tooltip" className={styles.dicaTag}>
                <strong>Prioridade {carta.prioridadeAtaque ?? 50}</strong>
                <span>O menor número ataca primeiro.</span>
              </span>
            </span>
          </div>
          {!modoDeck && !modoResultado && !modoBatalha && !modoAdmin && <button
            type="button"
            className={[styles.favoritoIcone, favorita ? styles.favoritoAtivo : ""].join(" ")}
            onClick={aoAlternarFavorita}
            aria-pressed={favorita}
            aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star aria-hidden="true" />
            {favorita ? "Nos favoritos" : "Favoritar carta"}
          </button>}
        </div>
      </div>

      {dicaAberta && <div className={styles.dicaMobile} role="status">
        {dicaAberta === "elemento" ? (
          <>
            <strong>Relação elemental</strong>
            <span>Vantagem contra {vantagem}. Desvantagem contra {desvantagem}.</span>
          </>
        ) : (
          <>
            <strong>Prioridade {carta.prioridadeAtaque ?? 50}</strong>
            <span>O menor número ataca primeiro.</span>
          </>
        )}
      </div>}

      <section className={styles.secaoAtributos} aria-label="Atributos base da carta">
        <h3>Atributos base <span>Valores antes dos efeitos da batalha</span></h3>
        <div className={styles.atributos}>
          <div className={styles.atributo}>
            <Heart className={styles.verde} aria-hidden="true" />
            <span>Vida <small>HP</small></span>
            <strong className={styles.verde}>{carta.hpBase ?? 0}</strong>
          </div>
          <div className={styles.atributo}>
            <Swords className={styles.vermelho} aria-hidden="true" />
            <span>Ataque <small>ATK</small></span>
            <strong className={styles.vermelho}>{carta.danoBase ?? 0}</strong>
          </div>
          <div className={styles.atributo}>
            <Shield className={styles.azul} aria-hidden="true" />
            <span>Defesa <small>DEF</small></span>
            <strong className={styles.azul}>{carta.defesaBase ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className={styles.secaoDetalhe}>
        <h3>Habilidades <span>O que cada uma faz durante o combate</span></h3>
        <div className={styles.listaHabilidades}>
          {habilidades.map((habilidade) => (
            <div className={styles.passiva} key={habilidade.id}>
              <p>
                <strong>{habilidade.nome}</strong>
                {habilidade.descricao || "Efeito ainda não descrito."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.acoesDetalhe}>
        {modoResultado && <p>{modoPrevia ? "Esta carta pode aparecer neste banner." : valorVendaResultado > 0 ? `Cópia vendida automaticamente por ${valorVendaResultado.toLocaleString("pt-BR")} Rubys.` : "Nova carta adicionada à sua coleção."}</p>}
        {!modoDeck && !modoResultado && !modoBatalha && !modoAdmin && carta.obtida && <p>Escolha um deck para usar esta carta nas batalhas.</p>}
        <button
          className={styles.botaoPrimario}
          type="button"
          onClick={modoDeck || modoResultado || modoBatalha || modoAdmin ? aoFechar : aoAdicionarAoDeck}
          disabled={!modoDeck && !modoResultado && !modoBatalha && !modoAdmin && !carta.obtida}
        >
          {!modoResultado && !modoBatalha && !modoAdmin && <PackagePlus aria-hidden="true" />}
          {modoResultado || modoBatalha || modoAdmin ? "Fechar" : modoDeck ? "Voltar ao deck" : carta.obtida ? "Adicionar a um deck" : "Carta não obtida"}
        </button>
      </div>
    </aside>
  );
}
