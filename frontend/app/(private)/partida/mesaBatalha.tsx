"use client";

import { nomeElementoCarta } from "../../components/elementosCarta";
import {
  Bot,
  Move,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { CartaMontada } from "../../components/cartaMontada";
import { IconeRuby } from "../../components/iconeRuby";
import { usePortalPronto } from "../../hooks/usePortalPronto";
import { buscarColecao, type AcaoTurno, type CartaColecao, type CartaPartida, type EstadoPartida } from "../../lib/jogo";
import { mapearCarta } from "../cartas/cardData";
import { DetalheCarta } from "../cartas/components/detalheCarta";
import detalheStyles from "../../styles/inventario/details.module.css";
import styles from "../../styles/partida.module.css";
import { useAnimacaoTurno, type AnimacaoDano } from "./useAnimacaoTurno";
import { useHabilidadesTurno } from "./useHabilidadesTurno";

type Props = {
  partida: EstadoPartida;
  processando: boolean;
  erro: string;
  onExecutarAcao: (acao: AcaoTurno) => void;
  onNovaBatalha: () => void;
  textoFinal?: string;
};

function percentualHp(carta: CartaPartida) {
  return Math.max(0, Math.min(100, (carta.hpAtual / carta.hp) * 100));
}

function CartaNaMesa({
  carta,
  lado,
  animacao,
  habilidadeAtiva,
  aoAbrirDetalhe,
}: {
  carta: CartaPartida;
  lado: "jogador" | "bot";
  animacao: AnimacaoDano | null;
  habilidadeAtiva: { id: string; nome: string; origem: "JOGADOR" | "BOT" } | null;
  aoAbrirDetalhe: (carta: CartaPartida) => void;
}) {
  const origem = lado === "jogador" ? "JOGADOR" : "BOT";
  return (
    <article
      className={`${styles.cartaCampo} ${styles[lado]}`}
      data-animacao={
        animacao?.origem === (lado === "jogador" ? "JOGADOR" : "BOT")
          ? "atacando"
          : animacao?.alvo === (lado === "jogador" ? "JOGADOR" : "BOT")
            ? "recebendo"
            : undefined
      }
    >
      <div className={styles.statusCarta}>
        <span>
          <strong>{carta.nome}</strong>
          <small>
            {carta.raridade} · {nomeElementoCarta(carta.elemento)} · P{carta.prioridadeAtaque}
          </small>
        </span>
        <b>
          {carta.hpAtual}/{carta.hp} HP
        </b>
        <span className={styles.barraHp}>
          <i style={{ width: `${percentualHp(carta)}%` }} />
        </span>
      </div>
      <button type="button" className={styles.cartaVisual} onClick={() => aoAbrirDetalhe(carta)} aria-label={`Ver detalhes de ${carta.nome}`}>
        <CartaMontada
          arte={carta.foto ?? undefined}
          moldura={carta.moldura ?? undefined}
          nome={carta.nome}
          raridade={carta.raridade}
          elemento={carta.elemento}
          config={carta.configVisual ?? undefined}
          placeholder={<Sparkles />}
        />
      </button>
      {habilidadeAtiva?.origem === origem ? (
        <output key={habilidadeAtiva.id} className={styles.habilidadeAtivada} aria-live="polite">
          <Sparkles aria-hidden="true" /> {habilidadeAtiva.nome}
        </output>
      ) : null}
      <div className={styles.atributosCarta}>
        <span
          className={
            carta.ataque !== carta.ataqueBase ? styles.atributoAlterado : ""
          }
        >
          <Swords /> ATQ <b>{carta.ataque}</b>
          {carta.ataque !== carta.ataqueBase ? (
            <em>
              {carta.ataque > carta.ataqueBase ? "+" : ""}
              {carta.ataque - carta.ataqueBase}
            </em>
          ) : null}
        </span>
        <span
          className={
            carta.defesa !== carta.defesaBase ? styles.atributoAlterado : ""
          }
        >
          <Shield /> DEF <b>{carta.defesa}</b>
          {carta.defesa !== carta.defesaBase ? (
            <em>
              {carta.defesa > carta.defesaBase ? "+" : ""}
              {carta.defesa - carta.defesaBase}
            </em>
          ) : null}
        </span>
      </div>
    </article>
  );
}

function DeckBatalha({
  cartas,
  ativa,
  lado,
  aoAbrirDetalhe,
}: {
  cartas: CartaPartida[];
  ativa: number;
  lado: "jogador" | "bot";
  aoAbrirDetalhe: (carta: CartaPartida) => void;
}) {
  const restantes = cartas.filter((carta) => !carta.derrotada).length;
  const inimigo = lado === "bot";

  return (
    <section className={`${styles.deckJogador} ${inimigo ? styles.deckInimigo : ""}`} aria-label={inimigo ? "Cartas do deck adversário" : "Cartas do meu deck"}>
      <header>
        <span>
          <strong>{inimigo ? "Deck adversário" : "Meu deck"}</strong>
          <small>
            {restantes} de {cartas.length} disponíveis
          </small>
        </span>
        <b>{cartas.length} cartas</b>
      </header>
      <div className={styles.gridDeckJogador}>
        {cartas.map((carta, indice) => (
          <button
            type="button"
            key={`${carta.id}-${indice}`}
            className={`${indice === ativa ? styles.miniCartaAtiva : ""} ${carta.derrotada ? styles.miniCartaDerrotada : ""}`}
            title={`${indice + 1}. ${carta.nome} — ${carta.hpAtual}/${carta.hp} HP`}
            aria-label={`Ver detalhes de ${carta.nome}`}
            onClick={() => aoAbrirDetalhe(carta)}
          >
            <div className={styles.miniCartaVisual}>
              <CartaMontada
                arte={carta.foto ?? undefined}
                moldura={carta.moldura ?? undefined}
                nome={carta.nome}
                raridade={carta.raridade}
                elemento={carta.elemento}
                config={carta.configVisual ?? undefined}
                placeholder={<Sparkles />}
              />
              <span>{indice + 1}</span>
            </div>
            <strong>{carta.nome}</strong>
            <span className={styles.miniCartaHp}>
              <i style={{ width: `${percentualHp(carta)}%` }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LogBatalha({ eventos }: { eventos: EstadoPartida["eventos"] }) {
  const listaRef = useRef<HTMLDivElement>(null);
  const arrasteRef = useRef<{ x: number; y: number; esquerda: number; topo: number } | null>(null);
  const tamanhoRef = useRef<{ x: number; y: number; largura: number; altura: number } | null>(null);
  const [alturaFixa, setAlturaFixa] = useState<number | null>(null);
  const [tamanhoFlutuante, setTamanhoFlutuante] = useState<{ largura: number; altura: number } | null>(null);
  const [flutuante, setFlutuante] = useState(false);
  const [posicao, setPosicao] = useState<{ x: number; y: number } | null>(null);
  const turnos = [...new Set(eventos.map((evento) => evento.turno))]
    .sort((a, b) => a - b)
    .map((turno) => ({
      turno,
      eventos: eventos
        .filter((evento) => evento.turno === turno)
        .sort((a, b) => a.sequencia - b.sequencia),
    }));

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [eventos.length]);

  function iniciarArraste(evento: PointerEvent<HTMLElement>) {
    if (!flutuante || (evento.target as HTMLElement).closest("button")) return;
    const painel = evento.currentTarget.parentElement;
    if (!painel) return;
    const limites = painel.getBoundingClientRect();
    arrasteRef.current = { x: evento.clientX, y: evento.clientY, esquerda: limites.left, topo: limites.top };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function moverPainel(evento: PointerEvent<HTMLElement>) {
    if (!arrasteRef.current) return;
    const largura = evento.currentTarget.parentElement?.offsetWidth ?? 0;
    const altura = evento.currentTarget.parentElement?.offsetHeight ?? 0;
    setPosicao({
      x: Math.max(16, Math.min(window.innerWidth - largura - 16, arrasteRef.current.esquerda + evento.clientX - arrasteRef.current.x)),
      y: Math.max(96, Math.min(window.innerHeight - altura - 16, arrasteRef.current.topo + evento.clientY - arrasteRef.current.y)),
    });
  }

  function iniciarRedimensionamento(evento: PointerEvent<HTMLButtonElement>) {
    const painel = evento.currentTarget.parentElement;
    if (!painel) return;
    tamanhoRef.current = { x: evento.clientX, y: evento.clientY, largura: painel.offsetWidth, altura: painel.offsetHeight };
    evento.currentTarget.setPointerCapture(evento.pointerId);
    evento.preventDefault();
  }

  function redimensionar(evento: PointerEvent<HTMLButtonElement>) {
    if (!tamanhoRef.current) return;
    const alturaMaxima = flutuante ? window.innerHeight - (posicao?.y ?? 96) - 16 : window.innerHeight - 32;
    const altura = Math.max(144, Math.min(alturaMaxima, tamanhoRef.current.altura + evento.clientY - tamanhoRef.current.y));
    if (flutuante) {
      setTamanhoFlutuante({
        largura: Math.max(224, Math.min(window.innerWidth - 32, tamanhoRef.current.largura + evento.clientX - tamanhoRef.current.x)),
        altura,
      });
    } else {
      setAlturaFixa(altura);
    }
  }

  return (
    <aside
      className={`${styles.logBatalha} ${flutuante ? styles.logFlutuante : ""}`}
      style={flutuante
        ? { ...(tamanhoFlutuante ? { width: tamanhoFlutuante.largura, height: tamanhoFlutuante.altura } : {}), ...(posicao ? { left: posicao.x, top: posicao.y, bottom: "auto", right: "auto" } : {}) }
        : alturaFixa ? { height: alturaFixa } : undefined}
    >
      <header onPointerDown={iniciarArraste} onPointerMove={moverPainel} onPointerUp={() => { arrasteRef.current = null; }}>
        <h2>
          <ScrollText /> Combate
        </h2>
        <div className={styles.controlesLog}>
          <button type="button" onClick={() => { setFlutuante((valor) => !valor); setPosicao(null); }} title={flutuante ? "Fixar log na lateral" : "Mover log como janela flutuante"} aria-label={flutuante ? "Fixar log na lateral" : "Mover log como janela flutuante"}>
            <Move />
          </button>
        </div>
      </header>
      <div ref={listaRef} className={styles.listaTurnos}>
        {turnos.map((grupo) => (
          <section key={grupo.turno} className={styles.grupoTurno}>
            <header>
              <strong>
                {grupo.turno === 0 ? "Preparação" : `Turno ${grupo.turno}`}
              </strong>
            </header>
            <div>
              {grupo.eventos.map((evento) => (
                <article
                  key={evento.id}
                  data-origem={evento.origem ?? "SISTEMA"}
                >
                  <b>{evento.tipo}</b>
                  <p>{evento.texto}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <button type="button" className={styles.alcaLog} aria-label="Arraste para redimensionar o log" title="Arraste para redimensionar" onPointerDown={iniciarRedimensionamento} onPointerMove={redimensionar} onPointerUp={() => { tamanhoRef.current = null; }} onPointerCancel={() => { tamanhoRef.current = null; }} />
    </aside>
  );
}

export function MesaBatalha({
  partida,
  processando,
  erro,
  onExecutarAcao,
  onNovaBatalha,
  textoFinal = "Escolher outro deck",
}: Props) {
  const finalizada = partida.status === "FINALIZADA";
  const { animacaoAtual, animando, pularAnimacao } = useAnimacaoTurno(
    partida,
  );
  const habilidadeAtiva = useHabilidadesTurno(partida);
  const cartaJogador = animacaoAtual?.cartaJogador ?? partida.jogador.cartas[partida.jogador.ativa];
  const cartaBot = animacaoAtual?.cartaBot ?? partida.bot.cartas[partida.bot.ativa];
  const bloqueado = processando || animando;
  const [cartasColecao, setCartasColecao] = useState<CartaColecao[]>([]);
  const [cartaDetalhada, setCartaDetalhada] = useState<CartaPartida | null>(null);
  const portalPronto = usePortalPronto();

  useEffect(() => {
    void buscarColecao("todas").then((resposta) => setCartasColecao(resposta.itens)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cartaDetalhada) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setCartaDetalhada(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [cartaDetalhada]);

  const cartaColecao = cartaDetalhada ? cartasColecao.find((carta) => carta.id === cartaDetalhada.id) : null;
  const cartaModal = cartaDetalhada ? mapearCarta(cartaColecao ?? {
    id: cartaDetalhada.id,
    nome: cartaDetalhada.nome,
    raridade: cartaDetalhada.raridade,
    elemento: cartaDetalhada.elemento as CartaColecao["elemento"],
    classe: "—",
    prioridadeAtaque: cartaDetalhada.prioridadeAtaque,
    custo: 0,
    hpBase: cartaDetalhada.hp,
    danoBase: cartaDetalhada.ataqueBase,
    defesaBase: cartaDetalhada.defesaBase,
    passiva: cartaDetalhada.passiva,
    foto: cartaDetalhada.foto,
    moldura: cartaDetalhada.moldura,
    configVisual: cartaDetalhada.configVisual,
    quantidade: 0,
    obtida: false,
    obtidaEm: null,
  }) : null;

  return (
    <section className={styles.batalhaLayout}>
      <div className={styles.arena}>
        <header className={styles.arenaTopo}>
          <span>
            <Bot />{" "}
            {partida.expedicao?.etapa === 3
              ? "Chefe"
              : "Adversário"}
          </span>
          <strong>Turno {partida.turno}</strong>
        </header>
        <div className={styles.decksArena}>
          <DeckBatalha
            cartas={partida.bot.cartas}
            ativa={animacaoAtual?.ativaBot ?? partida.bot.ativa}
            lado="bot"
            aoAbrirDetalhe={setCartaDetalhada}
          />
          <DeckBatalha
            cartas={partida.jogador.cartas}
            ativa={animacaoAtual?.ativaJogador ?? partida.jogador.ativa}
            lado="jogador"
            aoAbrirDetalhe={setCartaDetalhada}
          />
        </div>
        <div className={styles.mesaCampo}>
          {animacaoAtual ? (
            <output
              key={animacaoAtual.id}
              className={styles.danoGlobal}
              data-alvo={animacaoAtual.alvo}
              aria-live="assertive"
            >
              <strong>-{animacaoAtual.dano}</strong>
              <span>HP</span>
            </output>
          ) : null}
          <CartaNaMesa carta={cartaBot} lado="bot" animacao={animacaoAtual} habilidadeAtiva={habilidadeAtiva} aoAbrirDetalhe={setCartaDetalhada} />
          <div className={styles.centroArena}>
            {animacaoAtual ? (
              <span className={styles.acaoAtual} aria-live="polite">
                {animacaoAtual.origem === "JOGADOR"
                  ? "Você ataca"
                  : "Adversário ataca"}
              </span>
            ) : null}
            <span className={styles.marcaArena}>VS</span>
          </div>
          <CartaNaMesa
            carta={cartaJogador}
            lado="jogador"
            animacao={animacaoAtual}
            habilidadeAtiva={habilidadeAtiva}
            aoAbrirDetalhe={setCartaDetalhada}
          />
        </div>
        {animando ? (
          <div className={styles.controlesAnimacao}>
            <button type="button" onClick={pularAnimacao}>
              Pular animação
            </button>
          </div>
        ) : null}
        <div className={styles.rodapeArena}>
          {finalizada ? (
            <div className={styles.fimBatalha}>
              <Trophy />
              <small>Batalha finalizada</small>
              <h2>{partida.resultado}</h2>
              {partida.resultado === "VITORIA" ? (
                <p>
                  <IconeRuby /> +{partida.recompensas.rubys} Rubys · +
                  {partida.recompensas.pontos} pontos
                </p>
              ) : (
                <p>Prepare o deck e tente novamente.</p>
              )}
              <button type="button" onClick={onNovaBatalha}>
                {textoFinal}
              </button>
            </div>
          ) : (
            <div className={styles.acoesBatalha}>
              {erro ? <p className={styles.erro}>{erro}</p> : null}
              <div className={styles.gradeAcoes}>
                <button
                  type="button"
                  data-acao="ATACAR"
                  onClick={() => onExecutarAcao("ATACAR")}
                  disabled={bloqueado}
                >
                  <Swords />
                  <span>
                    <strong>Atacar</strong>
                    <small>Dano normal</small>
                  </span>
                </button>
                <button
                  type="button"
                  data-acao="DEFENDER"
                  onClick={() => onExecutarAcao("DEFENDER")}
                  disabled={bloqueado}
                >
                  <Shield />
                  <span>
                    <strong>Defender</strong>
                    <small>Reduz 55% do dano</small>
                  </span>
                </button>
              </div>
              <small className={styles.dicaAcoes}>
                Escolha sua ação. O adversário responde automaticamente.
              </small>
            </div>
          )}
        </div>
      </div>

      <LogBatalha eventos={partida.eventos} />
      {cartaModal && portalPronto ? createPortal(
        <div className={detalheStyles.modalDetalhe} role="dialog" aria-modal="true" aria-label={`Detalhes da carta ${cartaModal.nome}`} onClick={(evento) => {
          if (evento.target === evento.currentTarget) setCartaDetalhada(null);
        }}>
          <DetalheCarta carta={cartaModal} favorita={false} aoAlternarFavorita={() => {}} aoAdicionarAoDeck={() => {}} aoFechar={() => setCartaDetalhada(null)} modoBatalha />
        </div>, document.body) : null}
    </section>
  );
}
