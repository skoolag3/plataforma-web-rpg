"use client";

import {
  BellRing,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Gift,
  Mail,
  Megaphone,
  Percent,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buscarCorreio,
  marcarMensagemLida,
  type ItemCorreio,
} from "../lib/correio";
import styles from "../styles/correio.module.css";

const icones = {
  RECOMPENSA: Gift,
  EVENTO: Sparkles,
  PROMOCAO: Percent,
  AVISO: BellRing,
  NOVIDADE: Megaphone,
};

type FiltroCorreio = "todas" | "naoLidas";

function formatarData(data: string) {
  const instante = new Date(data);
  if (Number.isNaN(instante.getTime())) return "";

  const diferenca = Date.now() - instante.getTime();
  const minutos = Math.floor(diferenca / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias}d`;
  return instante.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function Correio() {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState<FiltroCorreio>("todas");
  const [itens, setItens] = useState<ItemCorreio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    setFalha(false);
    void buscarCorreio()
      .then((res) => setItens(res.itens))
      .catch(() => setFalha(true))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    let ativo = true;
    void buscarCorreio()
      .then((res) => {
        if (ativo) setItens(res.itens);
      })
      .catch(() => {
        if (ativo) setFalha(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    window.addEventListener("perfil-atualizado", carregar);
    return () => {
      ativo = false;
      window.removeEventListener("perfil-atualizado", carregar);
    };
  }, [carregar]);

  useEffect(() => {
    if (!aberto) return;

    function fechar(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto]);

  const naoLidas = itens.filter((item) => !item.lida).length;
  const itensVisiveis =
    filtro === "naoLidas" ? itens.filter((item) => !item.lida) : itens;

  function marcarLida(chave: string) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.chave === chave ? { ...item, lida: true } : item,
      ),
    );
    void marcarMensagemLida(chave).catch(() => carregar());
  }

  function marcarTodas() {
    const pendentes = itens.filter((item) => !item.lida);
    setItens((atuais) => atuais.map((item) => ({ ...item, lida: true })));
    void Promise.all(
      pendentes.map((item) => marcarMensagemLida(item.chave)),
    ).catch(() => carregar());
  }

  return (
    <div className={styles.raiz} ref={raizRef}>
      <button
        type="button"
        className={styles.gatilho}
        aria-label={`Abrir correio${naoLidas ? `, ${naoLidas} não lidas` : ""}`}
        aria-expanded={aberto}
        onClick={() => {
          setAberto((valor) => !valor);
          if (!aberto) carregar();
        }}
      >
        <Mail aria-hidden="true" />
        {naoLidas ? <b>{Math.min(naoLidas, 9)}</b> : null}
      </button>

      {aberto ? (
        <section
          className={styles.painel}
          aria-label="Caixa de entrada"
          role="dialog"
        >
          <header>
            <span>
              <strong>Correio</strong>
              <small>
                {naoLidas
                  ? `${naoLidas} ${naoLidas === 1 ? "mensagem não lida" : "mensagens não lidas"}`
                  : "Tudo em dia por aqui"}
              </small>
            </span>
            <div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar correio"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            className={styles.filtros}
            role="tablist"
            aria-label="Filtrar mensagens"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filtro === "todas"}
              onClick={() => setFiltro("todas")}
            >
              Todas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtro === "naoLidas"}
              onClick={() => setFiltro("naoLidas")}
            >
              Não lidas {naoLidas ? <b>{naoLidas}</b> : null}
            </button>
            {naoLidas ? (
              <button
                type="button"
                className={styles.marcarTodas}
                onClick={marcarTodas}
              >
                <CheckCheck aria-hidden="true" />
                Marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className={styles.lista}>
            {carregando ? (
              <div
                className={styles.carregando}
                aria-label="Carregando mensagens"
              >
                <span />
                <span />
                <span />
              </div>
            ) : falha ? (
              <div className={styles.vazio}>
                <BellRing aria-hidden="true" />
                <strong>Não foi possível abrir o correio</strong>
                <p>Tente carregar as mensagens novamente.</p>
                <button type="button" onClick={carregar}>
                  Tentar novamente
                </button>
              </div>
            ) : itensVisiveis.length ? (
              itensVisiveis.map((item) => {
                const Icone = icones[item.tipo];
                return (
                  <Link
                    href={item.href}
                    key={item.chave}
                    className={styles.mensagem}
                    data-lida={item.lida}
                    data-tipo={item.tipo}
                    onClick={() => {
                      marcarLida(item.chave);
                      setAberto(false);
                    }}
                  >
                    <span className={styles.icone}>
                      <Icone aria-hidden="true" />
                    </span>
                    <span className={styles.conteudo}>
                      <span>
                        <small>{item.tipo.toLowerCase()}</small>
                        {!item.lida ? <i>Nova</i> : null}
                      </span>
                      <strong>{item.titulo}</strong>
                      <p>{item.resumo}</p>
                      <span className={styles.rodapeMensagem}>
                        <em>{item.acao}</em>
                        <time dateTime={item.criadoEm}>
                          {formatarData(item.criadoEm)}
                        </time>
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                );
              })
            ) : (
              <div className={styles.vazio}>
                <CalendarDays aria-hidden="true" />
                <strong>
                  {filtro === "naoLidas"
                    ? "Nenhuma mensagem não lida"
                    : "Seu correio está vazio"}
                </strong>
                <p>
                  {filtro === "naoLidas"
                    ? "Você já conferiu todas as mensagens."
                    : "Recompensas e comunicados aparecerão aqui."}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
