"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faArrowRight,
  faCalendarDays,
  faCheck,
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
import Image from "next/image";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useState } from "react";
import { CartaMontada } from "../components/cartaMontada";
import { ShaderBackground } from "../components/ui/shaderBackground";
import { listarNoticias, type NoticiaPublica } from "../lib/noticias";
import { listarCartasVitrine, type CartaVitrine } from "../lib/vitrine";
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
  resumo: string;
  data: string;
};

const recursos = [
  {
    icone: faScaleBalanced,
    titulo: "Regras justas",
    texto: "As jogadas são validadas pelo servidor.",
  },
  {
    icone: faDiceD6,
    titulo: "Decks de 6 cartas",
    texto: "Monte combinações curtas e estratégicas.",
  },
  {
    icone: faShieldHalved,
    titulo: "Progressão sem pay-to-win",
    texto: "Ganhe cartas e Rubys jogando.",
  },
] satisfies TopicoLanding[];

const metricas = [
  { icone: faLayerGroup, valor: "6", texto: "Cartas por deck" },
  { icone: faRobot, valor: "Duelos", texto: "Contra bot" },
  { icone: faRankingStar, valor: "Progressão", texto: "Sem pay-to-win" },
] satisfies MetricaLanding[];

const imagemFlare =
  "https://res.cloudinary.com/djqmayaj1/image/upload/v1786235712/moderation/cartas/fotos/file_la63u8.png";
const molduraFlare =
  "https://res.cloudinary.com/djqmayaj1/image/upload/v1786237975/moderation/cartas/molduras/file_pav0ss.png";

const cartas = [
  {
    id: "flare-esquerda",
    nome: "Flare",
    funcao: "UR",
    elemento: "fogo",
    imagem: imagemFlare,
    moldura: molduraFlare,
    classe: styles.cartaUm,
  },
  {
    id: "flare-centro",
    nome: "Flare",
    funcao: "UR",
    elemento: "fogo",
    imagem: imagemFlare,
    moldura: molduraFlare,
    classe: styles.cartaDois,
  },
  {
    id: "flare-direita",
    nome: "Flare",
    funcao: "UR",
    elemento: "fogo",
    imagem: imagemFlare,
    moldura: molduraFlare,
    classe: styles.cartaTres,
  },
];

const noticiasExemplo = [
  {
    icone: faTrophy,
    tag: "Novidade",
    tagClasse: styles.tagTemporada,
    titulo: "Novas cartas chegam à arena",
    resumo: "Amplie sua coleção, teste novas combinações e evolua seus decks.",
    data: "12 MAI 2026",
  },
  {
    icone: faBolt,
    tag: "Balance",
    tagClasse: styles.tagBalanceamento,
    titulo: "Ajustes no custo de energia",
    resumo:
      "Mudanças pontuais deixam os duelos mais dinâmicos e abrem novas estratégias.",
    data: "10 MAI 2026",
  },
  {
    icone: faWandMagicSparkles,
    tag: "Evento",
    tagClasse: styles.tagEvento,
    titulo: "Registro antecipado libera carta rara",
    resumo:
      "Crie sua conta antes da estreia e comece a jornada com uma carta especial.",
    data: "08 MAI 2026",
  },
] satisfies NoticiaLanding[];

function obterEstiloParticula(indice: number) {
  return {
    "--posEsquerda": `${((indice * 7) % 104) - 4}%`,
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

export function LandingContent({
  modalInicial = null,
}: PropriedadesLandingContent) {
  const [modal, setModal] = useState<TipoModal>(modalInicial);
  const [noticiasPublicadas, setNoticiasPublicadas] = useState<
    NoticiaPublica[]
  >([]);
  const [cartasVitrine, setCartasVitrine] = useState<CartaVitrine[]>([]);

  useEffect(() => {
    setModal(modalInicial);
  }, [modalInicial]);

  useEffect(() => {
    listarNoticias()
      .then(setNoticiasPublicadas)
      .catch(() => undefined);
    listarCartasVitrine()
      .then(setCartasVitrine)
      .catch(() => undefined);
  }, []);

  return (
    <main className={styles.pagina}>
      <ShaderBackground className={styles.shaderHero} />
      <section id="home" className={styles.hero}>
        <div className={styles.particulas} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, indice) => (
            <span key={indice} style={obterEstiloParticula(indice)} />
          ))}
        </div>
        <div className={styles.gradeHero}>
          <div className={styles.conteudoHero}>
            <h1 className={styles.tituloHero}>
              Sua estratégia.
              <br />
              Seu deck.
              <br />
              <span>Sua lenda.</span>
            </h1>
            <p className={styles.textoHero}>
              Colecione heróis, crie combos poderosos e domine duelos táticos em
              partidas rápidas direto do navegador.
            </p>

            <div className={styles.acoesHero}>
              <Link href="/cadastro" className={styles.btnJogar}>
                <FontAwesomeIcon
                  className={styles.iconeBtnJogar}
                  icon={faPlay}
                  aria-hidden="true"
                />
                Jogar grátis
              </Link>
              <Link href="#como-jogar" className={styles.btnSecundario}>
                Conhecer o jogo
                <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
              </Link>
            </div>

          </div>

          <div id="cartas" className={styles.visualHero}>
            <div className={styles.personagemHero} />
            <div
              className={styles.conjuntoCartas}
              aria-label="Cartas de exemplo"
            >
              {(cartasVitrine.length
                ? cartasVitrine.map((carta) => ({
                    id: carta.id,
                    nome: carta.nome,
                    funcao: carta.raridade,
                    elemento: carta.elemento,
                    imagem: carta.foto ?? "",
                    moldura: carta.moldura ?? "",
                    configVisual: carta.config_visual ?? undefined,
                  }))
                : cartas
              ).map((carta, indice) => (
                <article
                  className={`${styles.cartaAnime} ${[styles.cartaUm, styles.cartaDois, styles.cartaTres][indice]}`}
                  key={carta.id}
                  onPointerMove={aoMoverPonteiroCarta}
                  onPointerLeave={aoSairPonteiroCarta}
                >
                  <CartaMontada
                    arte={carta.imagem}
                    moldura={carta.moldura}
                    nome={carta.nome}
                    raridade={carta.funcao}
                    elemento={carta.elemento}
                    config={
                      "configVisual" in carta ? carta.configVisual : undefined
                    }
                  />
                </article>
              ))}
            </div>
          </div>

          <div id="como-jogar" className={styles.gradeRecursos}>
            {recursos.map((recurso) => (
              <div className={styles.recurso} key={recurso.titulo}>
                <span className={styles.iconeRecurso} aria-hidden="true">
                  <FontAwesomeIcon icon={faCheck} />
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
                <FontAwesomeIcon
                  className={styles.iconeMetrica}
                  icon={metrica.icone}
                  aria-hidden="true"
                />
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
          <div>
            <span className={styles.seloNoticias}>Central da arena</span>
            <h2>
              <FontAwesomeIcon icon={faNewspaper} aria-hidden="true" />
              Notícias
            </h2>
          </div>
          <p>Novidades do jogo, mudanças de balanceamento e eventos para acompanhar sem sair da arena.</p>
        </div>
        <div className={styles.gradeNoticias}>
          {(noticiasPublicadas.length
            ? noticiasPublicadas
            : noticiasExemplo
          ).map((noticia) => {
            const categoria =
              "categoria" in noticia
                ? noticia.categoria
                : noticia.tag.toUpperCase();
            const visual =
              categoria === "BALANCE"
                ? { icone: faBolt, classe: styles.tagBalanceamento, card: styles.cardBalanceamento }
                : categoria === "EVENTO"
                  ? { icone: faWandMagicSparkles, classe: styles.tagEvento, card: styles.cardEvento }
                  : { icone: faTrophy, classe: styles.tagTemporada, card: styles.cardAviso };
            const data =
              "criado_em" in noticia
                ? new Date(noticia.criado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : noticia.data;
            const conteudo = (
              <>
                {"imagem" in noticia && noticia.imagem ? (
                  <Image
                    className={styles.imagemNoticia}
                    src={noticia.imagem}
                    alt=""
                    width={560}
                    height={220}
                  />
                ) : null}
                <div className={styles.topoNoticia}>
                  <span
                    className={`${styles.tagNoticia} ${"tagClasse" in noticia ? noticia.tagClasse : visual.classe}`}
                  >
                    {"tag" in noticia ? noticia.tag : noticia.categoria}
                  </span>
                  <FontAwesomeIcon
                    className={styles.iconeNoticia}
                    icon={"icone" in noticia ? noticia.icone : visual.icone}
                    aria-hidden="true"
                  />
                </div>
                <h3>{noticia.titulo}</h3>
                <p>{noticia.resumo}</p>
                <span className={styles.rodapeNoticia}>
                  <time>
                    <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                    {data}
                  </time>
                  <span className={styles.lerMais}>
                    Ler novidade{" "}
                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                  </span>
                </span>
              </>
            );
            return "id" in noticia ? (
              <Link
                className={`${styles.cardNoticia} ${visual.card}`}
                href={`/noticias/${noticia.id}`}
                key={noticia.id}
              >
                {conteudo}
              </Link>
            ) : (
              <article className={`${styles.cardNoticia} ${visual.card}`} key={noticia.titulo}>
                {conteudo}
              </article>
            );
          })}
        </div>
      </section>

      {modal === "login" ? (
        <ModalLogin aoFechar={() => setModal(null)} aoTrocar={setModal} />
      ) : null}
      {modal === "cadastro" ? (
        <ModalCadastro aoFechar={() => setModal(null)} aoTrocar={setModal} />
      ) : null}
      {modal === "forgot" ? (
        <ModalEsqueciSenha
          aoFechar={() => setModal(null)}
          aoTrocar={setModal}
        />
      ) : null}
    </main>
  );
}
