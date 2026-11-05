"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser } from "../lib/auth";
import styles from "../styles/guiaPrimeirosPassos.module.css";

const etapas = [
  { alvo: "correio", rota: "/home", titulo: "Veja suas notificações", texto: "Abra o sino para conferir mensagens e recompensas." },
  { alvo: "recompensa", rota: "/home", titulo: "Pegue seus Rubys", texto: "Se houver uma recompensa, toque em Reivindicar. Depois, continue o guia." },
  { alvo: "banner", rota: "/banners", titulo: "Invoque suas primeiras cartas", texto: "Escolha um banner e use seus Rubys para aumentar sua coleção." },
  { alvo: "deck", rota: "/decks", titulo: "Monte seu deck", texto: "Escolha as cartas que vão lutar por você e salve sua formação." },
  { alvo: "expedicao", rota: "/expedicao", titulo: "Comece a expedição", texto: "Com o deck pronto, inicie a jornada. Você pode voltar a qualquer tela depois." },
] as const;

type Retangulo = { top: number; left: number; width: number; height: number };

export function GuiaPrimeirosPassos() {
  const router = useRouter();
  const pathname = usePathname();
  const [chave, setChave] = useState("");
  const [indice, setIndice] = useState(0);
  const [alvo, setAlvo] = useState<Retangulo | null>(null);

  useEffect(() => {
    let ativo = true;
    const usuario = getStoredUser();
    if (!usuario || usuario.is_admin || pathname !== "/home") return;
    const criadoEm = usuario.criado_em ? Date.parse(usuario.criado_em) : NaN;
    if (!Number.isFinite(criadoEm) || Date.now() - criadoEm > 30 * 24 * 60 * 60 * 1000) return;
    const chaveUsuario = `animecards_guia_inicial_${usuario.id}`;
    if (localStorage.getItem(chaveUsuario)) return;
    queueMicrotask(() => { if (ativo) setChave(chaveUsuario); });
    return () => { ativo = false; };
  }, [pathname]);

  const etapa = etapas[indice];

  useEffect(() => {
    if (!chave || pathname !== etapa.rota) return;
    let rolouParaAlvo = false;
    const atualizar = () => {
      const elemento = document.querySelector<HTMLElement>(`[data-guia="${etapa.alvo}"]`);
      if (!elemento) { setAlvo(null); return; }
      if (!rolouParaAlvo && indice > 1) {
        elemento.scrollIntoView({ block: "center", behavior: "smooth" });
        rolouParaAlvo = true;
      }
      const rect = elemento.getBoundingClientRect();
      setAlvo({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    atualizar();
    const intervalo = window.setInterval(atualizar, 350);
    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [chave, etapa, indice, pathname]);

  function finalizar() {
    localStorage.setItem(chave, "concluido");
    setChave("");
  }

  function avancar() {
    if (indice === etapas.length - 1) { finalizar(); return; }
    const proxima = etapas[indice + 1];
    if (pathname === "/home" && proxima.rota !== "/home") {
      const btnCorreio = document.querySelector<HTMLButtonElement>('[data-guia="correio"]');
      if (btnCorreio?.getAttribute("aria-expanded") === "true") btnCorreio.click();
    }
    setAlvo(null);
    setIndice(indice + 1);
    if (pathname !== proxima.rota) router.push(proxima.rota);
  }

  if (!chave || pathname !== etapa.rota) return null;

  const posicaoTopo = alvo && alvo.top + alvo.height + 190 < window.innerHeight
    ? alvo.top + alvo.height + 16
    : alvo ? Math.max(16, alvo.top - 190) : Math.max(80, window.innerHeight / 2 - 95);
  const posicaoEsquerda = alvo
    ? Math.max(16, Math.min(alvo.left, window.innerWidth - 336))
    : Math.max(16, window.innerWidth / 2 - 160);

  return (
    <div className={styles.guia} aria-live="polite">
      {alvo ? <div className={styles.destaque} style={{ top: alvo.top - 5, left: alvo.left - 5, width: alvo.width + 10, height: alvo.height + 10 }} aria-hidden="true" /> : null}
      <section className={styles.cartao} style={{ top: posicaoTopo, left: posicaoEsquerda }} aria-label="Guia de primeiros passos">
        <small>Primeiros passos · {indice + 1}/{etapas.length}</small>
        <h2>{etapa.titulo}</h2>
        <p>{etapa.texto}</p>
        <div className={styles.acoes}>
          <button type="button" onClick={finalizar}>Pular guia</button>
          <button type="button" onClick={avancar}>{indice === etapas.length - 1 ? "Concluir" : "Próximo"}</button>
        </div>
      </section>
    </div>
  );
}
