"use client";

import {
  Bot,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { CartaMontada } from "../../components/cartaMontada";
import { CartaVerso } from "../../components/cartaVerso";
import { IconeRuby } from "../../components/iconeRuby";
import type { AcaoTurno, CartaPartida, EstadoPartida } from "../../lib/jogo";
import styles from "../../styles/partida.module.css";
import { useAnimacaoTurno, type AnimacaoDano } from "./useAnimacaoTurno";

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
}: {
  carta: CartaPartida;
  lado: "jogador" | "bot";
  animacao: AnimacaoDano | null;
}) {
  const passiva =
    typeof carta.passiva.nome === "string" ? carta.passiva.nome : "Sem passiva";
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
            {carta.raridade} · {carta.elemento} · P{carta.prioridadeAtaque}
          </small>
        </span>
        <b>
          {carta.hpAtual}/{carta.hp} HP
        </b>
        <span className={styles.barraHp}>
          <i style={{ width: `${percentualHp(carta)}%` }} />
        </span>
      </div>
      <div className={styles.cartaVisual}>
        <CartaMontada
          arte={carta.foto ?? undefined}
          moldura={carta.moldura ?? undefined}
          nome={carta.nome}
          raridade={carta.raridade}
          elemento={carta.elemento}
          config={carta.configVisual ?? undefined}
          placeholder={<Sparkles />}
          verso={
            <CartaVerso
              nome={carta.nome}
              raridade={carta.raridade}
              elemento={carta.elemento}
              hp={carta.hp}
              ataque={carta.ataque}
              defesa={carta.defesa}
            />
          }
        />
      </div>
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
      {passiva !== "Sem passiva" ? (
        <p className={styles.passivaCarta}>
          <Sparkles /> {passiva}
        </p>
      ) : null}
    </article>
  );
}

function FilaDeck({
  cartas,
  ativa,
  lado,
}: {
  cartas: CartaPartida[];
  ativa: number;
  lado: string;
}) {
  return (
    <div className={styles.filaDeck} aria-label={`Ordem do deck ${lado}`}>
      {cartas.map((carta, indice) => (
        <span
          key={`${carta.id}-${indice}`}
          className={`${indice === ativa ? styles.cartaAtivaFila : ""} ${carta.derrotada ? styles.cartaDerrotada : ""}`}
          style={
            carta.foto ? { backgroundImage: `url("${carta.foto}")` } : undefined
          }
          title={`${indice + 1}. ${carta.nome}`}
        >
          <b>{indice + 1}</b>
        </span>
      ))}
    </div>
  );
}

function DeckJogador({
  cartas,
  ativa,
}: {
  cartas: CartaPartida[];
  ativa: number;
}) {
  const restantes = cartas.filter((carta) => !carta.derrotada).length;

  return (
    <section className={styles.deckJogador} aria-label="Cartas do meu deck">
      <header>
        <span>
          <strong>Meu deck</strong>
          <small>
            {restantes} de {cartas.length} disponíveis
          </small>
        </span>
        <b>{cartas.length} cartas</b>
      </header>
      <div className={styles.gridDeckJogador}>
        {cartas.map((carta, indice) => (
          <article
            key={`${carta.id}-${indice}`}
            className={`${indice === ativa ? styles.miniCartaAtiva : ""} ${carta.derrotada ? styles.miniCartaDerrotada : ""}`}
            title={`${indice + 1}. ${carta.nome} — ${carta.hpAtual}/${carta.hp} HP`}
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
          </article>
        ))}
      </div>
    </section>
  );
}

function LogBatalha({ eventos }: { eventos: EstadoPartida["eventos"] }) {
  const listaRef = useRef<HTMLDivElement>(null);
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

  return (
    <aside className={styles.logBatalha}>
      <header>
        <h2>
          <ScrollText /> Combate
        </h2>
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
  const cartaJogador = partida.jogador.cartas[partida.jogador.ativa];
  const cartaBot = partida.bot.cartas[partida.bot.ativa];
  const finalizada = partida.status === "FINALIZADA";
  const { animacaoAtual, animando, pularAnimacao } = useAnimacaoTurno(
    partida.eventos,
  );
  const bloqueado = processando || animando;

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
          {animando ? (
            <button type="button" onClick={pularAnimacao}>
              Pular animação
            </button>
          ) : null}
        </header>
        <FilaDeck
          cartas={partida.bot.cartas}
          ativa={partida.bot.ativa}
          lado="adversário"
        />
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
          <CartaNaMesa carta={cartaBot} lado="bot" animacao={animacaoAtual} />
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
          />
        </div>
        <div className={styles.rodapeArena}>
          <DeckJogador
            cartas={partida.jogador.cartas}
            ativa={partida.jogador.ativa}
          />
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
    </section>
  );
}
