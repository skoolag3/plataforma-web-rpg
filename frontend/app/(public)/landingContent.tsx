"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faCalendarDays,
  faDiceD6,
  faLayerGroup,
  faNewspaper,
  faPlay,
  faRankingStar,
  faRobot,
  faScaleBalanced,
  faShieldHalved,
  faTrophy,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useState } from "react";
import { ModalEsqueciSenha, ModalLogin, ModalCadastro } from "./authModal";
import estilosBase from "../styles/landingBase.module.css";
import estilosHero from "../styles/landingHero.module.css";
import estilosInfo from "../styles/landingInfo.module.css";
import estilosMetricas from "../styles/landingMetricas.module.css";
import estilosNoticias from "../styles/landingNoticias.module.css";
import estilosResponsivo from "../styles/landingResponsivo.module.css";
import estilosVisual from "../styles/landingVisual.module.css";

function combinarEstilos(...modulos: Array<Record<string, string>>) {
  return modulos.reduce<Record<string, string>>((classes, modulo) => {
    Object.entries(modulo).forEach(([nome, classe]) => {
      classes[nome] = classes[nome] ? `${classes[nome]} ${classe}` : classe;
    });

    return classes;
  }, {});
}

const styles = combinarEstilos(
  estilosBase,
  estilosHero,
  estilosInfo,
  estilosVisual,
  estilosMetricas,
  estilosNoticias,
  estilosResponsivo,
);

type TipoModal = "login" | "cadastro" | "forgot" | null;

type PropriedadesLandingContent = {
  modalInicial?: Exclude<TipoModal, "forgot">;
};

type TopicoLanding = {
  icone: IconDefinition;
  titulo: string;
  texto: string;
};

type MetricaLanding = {
  icone: IconDefinition;
  valor: string;
  texto: string;
};

type NoticiaLanding = {
  icone: IconDefinition;
  tag: string;
  tagClasse: string;
  titulo: string;
  data: string;
};

const recursos = [
  { icone: faScaleBalanced, titulo: "Regras justas", texto: "As jogadas sao validadas pelo servidor." },
  { icone: faDiceD6, titulo: "Decks de 6 cartas", texto: "Monte combinacoes curtas e estrategicas." },
  { icone: faShieldHalved, titulo: "Progressao sem pay-to-win", texto: "Ganhe cartas e Rubys jogando." },
] satisfies TopicoLanding[];

const metricas = [
  { icone: faLayerGroup, valor: "6", texto: "Cartas por deck" },
  { icone: faRobot, valor: "Duelos", texto: "Contra bot" },
  { icone: faRankingStar, valor: "Progressao", texto: "Sem pay-to-win" },
] satisfies MetricaLanding[];

const imagemCarta =
  "https://res.cloudinary.com/djqmayaj1/image/upload/v1778560369/cbec6afb-0b8e-417b-951c-be06c253287b_ebvc4k.png";

const cartas = [
  { nome: "Kael", funcao: "Arcano", imagem: imagemCarta, classe: styles.cartaUm },
  { nome: "Riven", funcao: "Duelista", imagem: imagemCarta, classe: styles.cartaDois },
  { nome: "Nyra", funcao: "Suporte", imagem: imagemCarta, classe: styles.cartaTres },
];

const noticias = [
  { icone: faTrophy, tag: "Temporada", tagClasse: styles.tagTemporada, titulo: "Eclipse Roxo inicia a liga", data: "12 MAI 2026" },
  { icone: faBolt, tag: "Balance", tagClasse: styles.tagBalanceamento, titulo: "Ajustes no custo de energia", data: "10 MAI 2026" },
  { icone: faWandMagicSparkles, tag: "Evento", tagClasse: styles.tagEvento, titulo: "Registro antecipado libera carta rara", data: "08 MAI 2026" },
] satisfies NoticiaLanding[];

function obterEstiloParticula(indice: number) {
  return {
    "--posEsquerda": `${(indice * 7) % 104 - 4}%`,
    "--posTopo": `${18 + (indice % 6) * 11}%`,
    "--tamanho": `${0.18 + (indice % 4) * 0.08}rem`,
    "--duracao": `${6 + indice * 0.35}s`,
  } as CSSProperties;
}

function aoMoverPonteiroCarta(evento: PointerEvent<HTMLElement>) {
  const carta = evento.currentTarget;
  const retangulo = carta.getBoundingClientRect();
  const x = ((evento.clientX - retangulo.left) / retangulo.width) * 100;
  const y = ((evento.clientY - retangulo.top) / retangulo.height) * 100;
  const rotacaoY = (x - 50) / 7;
  const rotacaoX = (50 - y) / 9;

  carta.style.setProperty("--mouseX", `${x}%`);
  carta.style.setProperty("--mouseY", `${y}%`);
  carta.style.setProperty("--rotacaoX", `${rotacaoX}deg`);
  carta.style.setProperty("--rotacaoY", `${rotacaoY}deg`);
}

function aoSairPonteiroCarta(evento: PointerEvent<HTMLElement>) {
  const carta = evento.currentTarget;

  carta.style.setProperty("--mouseX", "50%");
  carta.style.setProperty("--mouseY", "34%");
  carta.style.setProperty("--rotacaoX", "0deg");
  carta.style.setProperty("--rotacaoY", "0deg");
}

export function LandingContent({ modalInicial = null }: PropriedadesLandingContent) {
  const [modal, setModal] = useState<TipoModal>(modalInicial);

  useEffect(() => {
    setModal(modalInicial);
  }, [modalInicial]);

  return (
    <main className={styles.pagina}>
      <section id="home" className={styles.hero}>
        <div className={styles.particulas} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, indice) => (
            <span key={indice} style={obterEstiloParticula(indice)} />
          ))}
        </div>
        <div className={styles.gradeHero}>
          <div className={styles.conteudoHero}>
            <h1 className={styles.tituloHero}>
              Monte seu deck.
              <br />
              Enfrente o bot.
              <br />
              <span>Suba no ranking.</span>
            </h1>
            <p className={styles.textoHero}>
              Duelos estrategicos contra bot, decks de ate 6 cartas e progressao
              justa direto pelo navegador.
            </p>

            <Link href="/cadastro" className={styles.btnJogar}>
              <FontAwesomeIcon className={styles.iconeBtnJogar} icon={faPlay} aria-hidden="true" />
              Jogar agora
            </Link>

          </div>

          <div id="cartas" className={styles.visualHero}>
            <div className={styles.personagemHero} />
            <div className={styles.conjuntoCartas} aria-label="Cartas de exemplo">
              {cartas.map((carta) => (
                <article
                  className={`${styles.cartaAnime} ${carta.classe}`}
                  key={carta.nome}
                  onPointerMove={aoMoverPonteiroCarta}
                  onPointerLeave={aoSairPonteiroCarta}
                >
                  <div className={styles.fundoCarta} />
                  <div className={styles.molduraCarta} />
                  <div className={styles.infoCarta}>
                    <strong>{carta.nome}</strong>
                    <span>{carta.funcao}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="como-jogar" className={styles.gradeRecursos}>
            {recursos.map((recurso) => (
              <div className={styles.recurso} key={recurso.titulo}>
                <span className={styles.iconeRecurso} aria-hidden="true">
                  <FontAwesomeIcon icon={recurso.icone} />
                </span>
                <div>
                  <strong>{recurso.titulo}</strong>
                  <small>{recurso.texto}</small>
                </div>
              </div>
            ))}
          </div>

          <div id="ranking" className={styles.metricas}>
            {metricas.map((metrica) => (
              <div className={styles.metrica} key={metrica.texto}>
                <FontAwesomeIcon className={styles.iconeMetrica} icon={metrica.icone} aria-hidden="true" />
                <div>
                  <strong>{metrica.valor}</strong>
                  <span>{metrica.texto}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="noticias" className={styles.secaoNoticias}>
        <div className={styles.cabecalhoNoticias}>
          <h2>
            <FontAwesomeIcon icon={faNewspaper} aria-hidden="true" />
            Noticias
          </h2>
          <p>Atualizacoes de temporada, balanceamento e eventos especiais.</p>
        </div>
        <div className={styles.gradeNoticias}>
          {noticias.map((noticia) => (
            <article className={styles.cardNoticia} key={noticia.titulo}>
              <div className={styles.topoNoticia}>
                <span className={`${styles.tagNoticia} ${noticia.tagClasse}`}>{noticia.tag}</span>
                <FontAwesomeIcon className={styles.iconeNoticia} icon={noticia.icone} aria-hidden="true" />
              </div>
              <h3>{noticia.titulo}</h3>
              <time>
                <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                {noticia.data}
              </time>
            </article>
          ))}
        </div>
      </section>

      {modal === "login" ? (
        <ModalLogin aoFechar={() => setModal(null)} aoTrocar={setModal} />
      ) : null}
      {modal === "cadastro" ? (
        <ModalCadastro aoFechar={() => setModal(null)} aoTrocar={setModal} />
      ) : null}
      {modal === "forgot" ? (
        <ModalEsqueciSenha aoFechar={() => setModal(null)} aoTrocar={setModal} />
      ) : null}
    </main>
  );
}

