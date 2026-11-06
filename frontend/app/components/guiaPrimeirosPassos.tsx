"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "../lib/auth";
import styles from "../styles/guiaPrimeirosPassos.module.css";

const etapas = [
  {
    alvo: "correio",
    rota: "/home",
    titulo: "Veja suas notificações",
    texto: "Abra o sino para conferir mensagens e recompensas de boas-vindas.",
    rotuloBotao: "Abrir notificações",
  },
  {
    alvo: "recompensa",
    rota: "/home",
    titulo: "Pegue seus Rubys",
    texto: "Toque em Reivindicar para coletar seus Rubys e continuar o guia.",
    rotuloBotao: "Ir para Banners",
  },
  {
    alvo: "banner",
    rota: "/banners",
    titulo: "Invoque suas primeiras cartas",
    texto: "Escolha um banner e use seus Rubys para aumentar sua coleção.",
    rotuloBotao: "Ir para Decks",
  },
  {
    alvo: "deck",
    rota: "/decks",
    titulo: "Monte seu deck",
    texto: "Escolha as cartas que vão lutar por você e salve sua formação.",
    rotuloBotao: "Ir para Expedição",
  },
  {
    alvo: "expedicao",
    rota: "/expedicao",
    titulo: "Comece a expedição",
    texto: "Com o deck pronto, inicie a jornada. Você pode voltar a qualquer tela depois.",
    rotuloBotao: "Concluir guia",
  },
] as const;

type Retangulo = { top: number; left: number; width: number; height: number };

function extrairDataCriacaoMs(dataStr?: string | null): number {
  if (!dataStr) return Date.now();
  const iso = Date.parse(dataStr);
  if (Number.isFinite(iso)) return iso;
  const match = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, dia, mes, ano] = match;
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime();
  }
  return Date.now();
}

export function GuiaPrimeirosPassos() {
  const router = useRouter();
  const pathname = usePathname();
  const [chave, setChave] = useState("");
  const [indice, setIndice] = useState(0);
  const [alvo, setAlvo] = useState<Retangulo | null>(null);
  const [recompensaColetada, setRecompensaColetada] = useState(false);

  // Inicializa a chave e recupera o passo salvo
  useEffect(() => {
    let ativo = true;
    const usuario = getStoredUser();
    if (!usuario) return;

    const chaveUsuario = `animecards_guia_inicial_${usuario.id}`;
    if (localStorage.getItem(chaveUsuario) === "concluido") return;

    const criadoEm = extrairDataCriacaoMs(usuario.criado_em);
    // Permite novas contas criadas nos últimos 60 dias ou que nunca concluíram o guia
    if (Date.now() - criadoEm > 60 * 24 * 60 * 60 * 1000) return;

    const chaveEtapa = `animecards_guia_etapa_${usuario.id}`;
    const etapaSalva = Number(sessionStorage.getItem(chaveEtapa));
    const passoInicial =
      Number.isInteger(etapaSalva) && etapaSalva >= 0 && etapaSalva < etapas.length
        ? etapaSalva
        : 0;

    queueMicrotask(() => {
      if (ativo) {
        setChave(chaveUsuario);
        setIndice(passoInicial);
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  // Sincroniza o passo caso o usuário mude de rota manualmente
  useEffect(() => {
    if (!chave) return;
    if (pathname === "/banners" && indice < 2) {
      setIndice(2);
    } else if (pathname === "/decks" && indice < 3) {
      setIndice(3);
    } else if (pathname === "/expedicao" && indice < 4) {
      setIndice(4);
    }
  }, [chave, pathname, indice]);

  // Salva o passo atual na sessionStorage
  useEffect(() => {
    const usuario = getStoredUser();
    if (!usuario || !chave) return;
    sessionStorage.setItem(`animecards_guia_etapa_${usuario.id}`, String(indice));
  }, [chave, indice]);

  // Escuta resgate de rubys para atualizar o passo 2
  useEffect(() => {
    function aoResgatarRubys() {
      setRecompensaColetada(true);
    }
    window.addEventListener("rubys-reivindicados", aoResgatarRubys);
    return () => {
      window.removeEventListener("rubys-reivindicados", aoResgatarRubys);
    };
  }, []);

  const etapa = etapas[indice];

  // Observa e avança automaticamente do passo 0 para o 1 quando o correio é aberto
  useEffect(() => {
    if (!chave || indice !== 0 || pathname !== "/home") return;

    const verificarAberto = () => {
      const btnCorreio = document.querySelector<HTMLButtonElement>('[data-guia="correio"]');
      if (btnCorreio && btnCorreio.getAttribute("aria-expanded") === "true") {
        setIndice(1);
      }
    };

    verificarAberto();
    const intervalo = window.setInterval(verificarAberto, 300);
    return () => window.clearInterval(intervalo);
  }, [chave, indice, pathname]);

  // No passo 1 (recompensa), garante que o correio esteja aberto para o elemento existir
  useEffect(() => {
    if (!chave || indice !== 1 || pathname !== "/home") return;

    const abrirTimer = window.setTimeout(() => {
      const btnCorreio = document.querySelector<HTMLButtonElement>('[data-guia="correio"]');
      if (btnCorreio && btnCorreio.getAttribute("aria-expanded") !== "true") {
        btnCorreio.click();
      }
    }, 150);

    return () => window.clearTimeout(abrirTimer);
  }, [chave, indice, pathname]);

  // Atualiza a posição do destaque visual
  const atualizarPosicao = useCallback(() => {
    if (!chave || !etapa || pathname !== etapa.rota) {
      setAlvo(null);
      return;
    }

    const elemento = document.querySelector<HTMLElement>(`[data-guia="${etapa.alvo}"]`);
    if (!elemento) {
      setAlvo(null);
      return;
    }

    const rect = elemento.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setAlvo(null);
      return;
    }

    setAlvo({
      top: Math.max(0, rect.top - 4),
      left: Math.max(0, rect.left - 4),
      width: rect.width + 8,
      height: rect.height + 8,
    });
  }, [chave, etapa, pathname]);

  useEffect(() => {
    atualizarPosicao();
    const intervalo = window.setInterval(atualizarPosicao, 300);
    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [atualizarPosicao]);

  function finalizar() {
    if (chave) {
      localStorage.setItem(chave, "concluido");
      const usuario = getStoredUser();
      if (usuario) {
        sessionStorage.removeItem(`animecards_guia_etapa_${usuario.id}`);
      }
    }
    setChave("");
  }

  function avancar() {
    // Se estiver no passo 0 (correio) e o usuário clicar no botão do cartão
    if (indice === 0) {
      const btnCorreio = document.querySelector<HTMLButtonElement>('[data-guia="correio"]');
      if (btnCorreio && btnCorreio.getAttribute("aria-expanded") !== "true") {
        btnCorreio.click();
      }
      setIndice(1);
      return;
    }

    if (indice === etapas.length - 1) {
      finalizar();
      return;
    }

    const proxima = etapas[indice + 1];

    // Se estiver no passo 1 e for para a próxima rota, fecha o correio
    if (indice === 1) {
      const btnCorreio = document.querySelector<HTMLButtonElement>('[data-guia="correio"]');
      if (btnCorreio?.getAttribute("aria-expanded") === "true") {
        btnCorreio.click();
      }
    }

    setAlvo(null);
    setIndice(indice + 1);

    if (pathname !== proxima.rota) {
      router.push(proxima.rota);
    }
  }

  if (!chave || !etapa || pathname !== etapa.rota) return null;

  // Texto adaptável para o passo de recompensas caso já tenha sido resgatada ou não haja itens
  let tituloPasso: string = etapa.titulo;
  let textoPasso: string = etapa.texto;
  let rotuloBotao: string = etapa.rotuloBotao;

  if (indice === 1) {
    if (recompensaColetada) {
      tituloPasso = "Rubys resgatados!";
      textoPasso = "Excelente! Agora use seus Rubys no portal de banners para invocar novas cartas.";
      rotuloBotao = "Ir para Banners";
    } else if (!alvo) {
      tituloPasso = "Notificações verificadas";
      textoPasso = "Você já está em dia com as recompensas! Vamos agora ao Portal de Invocação.";
      rotuloBotao = "Ir para Banners";
    }
  }

  const posicaoTopo =
    alvo && alvo.top + alvo.height + 210 < window.innerHeight
      ? alvo.top + alvo.height + 14
      : alvo
      ? Math.max(16, alvo.top - 210)
      : Math.max(80, window.innerHeight / 2 - 100);

  const posicaoEsquerda = alvo
    ? Math.max(16, Math.min(alvo.left, window.innerWidth - 356))
    : Math.max(16, window.innerWidth / 2 - 170);

  return (
    <div className={styles.guia} aria-live="polite">
      {alvo ? (
        <div
          className={styles.destaque}
          style={{
            top: alvo.top,
            left: alvo.left,
            width: alvo.width,
            height: alvo.height,
          }}
          aria-hidden="true"
        />
      ) : null}

      <section
        className={styles.cartao}
        style={{ top: posicaoTopo, left: posicaoEsquerda }}
        aria-label="Guia de primeiros passos"
      >
        <small>
          Primeiros passos · {indice + 1}/{etapas.length}
        </small>
        <h2>{tituloPasso}</h2>
        <p>{textoPasso}</p>
        <div className={styles.acoes}>
          <button type="button" className={styles.btnPular} onClick={finalizar}>
            Pular guia
          </button>
          <button type="button" className={styles.btnAvancar} onClick={avancar}>
            {rotuloBotao}
          </button>
        </div>
      </section>
    </div>
  );
}
