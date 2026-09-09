"use client";

import {
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  Footprints,
  LockKeyhole,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  Skull,
  Swords,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { EstadoExpedicao, OpcaoExpedicao } from "../../lib/jogo";
import styles from "../../styles/expedicao.module.css";

const iconeDificuldade = {
  FACIL: Shield,
  MEDIA: Swords,
  DIFICIL: Skull,
  CHEFE: Flag,
};

const posicoesY = [73, 50, 27];
const zoomMinimo = 0.72;
const zoomMaximo = 1.24;
const passoZoom = 0.08;

type PropsMapaExpedicao = {
  expedicao: EstadoExpedicao;
  processando: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
};

type LayoutTrilha = {
  posicoesX: number[][];
};

type EstadoConexao = "futura" | "disponivel" | "percorrida" | "descartada";

export function MapaExpedicao({
  expedicao,
  processando,
  onEscolher,
}: PropsMapaExpedicao) {
  const [zoom, setZoom] = useState(1);
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const arrasteRef = useRef({
    ativo: false,
    inicioX: 0,
    inicioY: 0,
    origemX: 0,
    origemY: 0,
  });
  const batalhaEmAndamento = expedicao.partidaAtual?.status === "EM_ANDAMENTO";
  const layout = useMemo(
    () => gerarLayoutTrilha(expedicao.seed, expedicao.etapas.length),
    [expedicao.etapas.length, expedicao.seed],
  );

  function alterarZoom(proximoZoom: number) {
    setZoom(Math.min(zoomMaximo, Math.max(zoomMinimo, proximoZoom)));
  }

  function iniciarPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button"))
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    arrasteRef.current = {
      ativo: true,
      inicioX: event.clientX,
      inicioY: event.clientY,
      origemX: deslocamento.x,
      origemY: deslocamento.y,
    };
    setArrastando(true);
  }

  function moverPan(event: ReactPointerEvent<HTMLDivElement>) {
    const arraste = arrasteRef.current;
    if (!arraste.ativo) return;
    setDeslocamento({
      x: limitar(arraste.origemX + event.clientX - arraste.inicioX, -180, 180),
      y: limitar(arraste.origemY + event.clientY - arraste.inicioY, -100, 100),
    });
  }

  function finalizarPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (!arrasteRef.current.ativo) return;
    arrasteRef.current.ativo = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setArrastando(false);
  }

  function restaurarMapa() {
    setZoom(1);
    setDeslocamento({ x: 0, y: 0 });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();
      setZoom((atual) =>
        Math.min(
          zoomMaximo,
          Math.max(
            zoomMinimo,
            atual + (event.deltaY > 0 ? -passoZoom : passoZoom),
          ),
        ),
      );
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <section className={styles.mapa}>
      <header className={styles.headerMapa}>
        <div>
          <span className={styles.sobretituloMapa}>
            <Footprints /> Trilha #{expedicao.seed.toString().slice(-6)}
          </span>
          <h2>
            {expedicao.etapaAtual === expedicao.etapas.length
              ? "O guardião espera no fim da trilha"
              : "Escolha seu próximo confronto"}
          </h2>
          <p>Explore a teia. O conteúdo será revelado conforme você avança.</p>
        </div>
        <div className={styles.infoMapa}>
          <small>Progresso da expedição</small>
          <strong>
            {Math.min(expedicao.etapaAtual + 1, expedicao.totalEtapas)} de{" "}
            {expedicao.totalEtapas}
          </strong>
          <span>{expedicao.deck.nome}</span>
        </div>
      </header>

      <div className={styles.barraMapa}>
        <span>Role para aplicar zoom · arraste para explorar</span>
        <div className={styles.controlesZoom} aria-label="Controles de zoom">
          <button
            type="button"
            onClick={() => alterarZoom(zoom - passoZoom)}
            disabled={zoom <= zoomMinimo}
            aria-label="Diminuir zoom"
          >
            <Minus />
          </button>
          <output>{Math.round(zoom * 100)}%</output>
          <button
            type="button"
            onClick={() => alterarZoom(zoom + passoZoom)}
            disabled={zoom >= zoomMaximo}
            aria-label="Aumentar zoom"
          >
            <Plus />
          </button>
          <button
            type="button"
            onClick={restaurarMapa}
            disabled={
              zoom === 1 && deslocamento.x === 0 && deslocamento.y === 0
            }
            aria-label="Restaurar zoom"
          >
            <RotateCcw />
          </button>
        </div>
      </div>

      <div
        className={styles.viewportTrilha}
        data-arrastando={arrastando || undefined}
        ref={viewportRef}
        onPointerDown={iniciarPan}
        onPointerMove={moverPan}
        onPointerUp={finalizarPan}
        onPointerCancel={finalizarPan}
      >
        <div className={styles.nevoaTrilha} aria-hidden="true" />
        <div
          className={styles.areaTrilha}
          style={
            {
              "--zoom-trilha": zoom,
              "--pan-x": `${deslocamento.x}px`,
              "--pan-y": `${deslocamento.y}px`,
            } as CSSProperties
          }
        >
          <ConexoesTrilha expedicao={expedicao} layout={layout} />

          <div className={styles.destinoTrilha}>
            <span>Destino final</span>
            <NoChefe
              expedicao={expedicao}
              processando={processando}
              batalhaEmAndamento={batalhaEmAndamento}
              onEscolher={onEscolher}
            />
          </div>

          {expedicao.etapas.map((etapa) => {
            const conteudoVisivel = etapa.indice <= expedicao.etapaAtual;
            return (
              <div
                className={styles.fileiraEtapa}
                style={
                  {
                    "--etapa-y": `${posicoesY[etapa.indice]}%`,
                  } as CSSProperties
                }
                key={etapa.indice}
              >
                <span className={styles.labelEtapa}>
                  Stage {etapa.indice + 1}
                </span>
                {etapa.opcoes.map((opcao, indiceOpcao) => {
                  const escolhida = expedicao.escolhas.includes(opcao.id);
                  const descartada = etapa.status === "CONCLUIDA" && !escolhida;
                  const disponivel =
                    etapa.status === "ATUAL" &&
                    !batalhaEmAndamento &&
                    expedicao.opcoesAtuais.some((item) => item.id === opcao.id);

                  return (
                    <NoConfronto
                      opcao={opcao}
                      posicao={layout.posicoesX[etapa.indice][indiceOpcao]}
                      conteudoVisivel={conteudoVisivel}
                      escolhida={escolhida}
                      descartada={descartada}
                      disponivel={disponivel}
                      processando={processando}
                      onEscolher={onEscolher}
                      key={opcao.id}
                    />
                  );
                })}
              </div>
            );
          })}

          <div className={styles.entradaTrilha}>
            <span className={styles.marcaEntrada}>
              <Footprints />
            </span>
            <small>Entrada</small>
          </div>
        </div>
      </div>

      <footer className={styles.legendaMapa}>
        <span>
          <i data-cor="disponivel" /> Caminho disponível
        </span>
        <span>
          <i data-cor="percorrido" /> Rota percorrida
        </span>
        <span>
          <i data-cor="futuro" /> Área desconhecida
        </span>
      </footer>
    </section>
  );
}

function NoConfronto({
  opcao,
  posicao,
  conteudoVisivel,
  escolhida,
  descartada,
  disponivel,
  processando,
  onEscolher,
}: {
  opcao: OpcaoExpedicao;
  posicao: number;
  conteudoVisivel: boolean;
  escolhida: boolean;
  descartada: boolean;
  disponivel: boolean;
  processando: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
}) {
  const Icone = conteudoVisivel
    ? iconeDificuldade[opcao.dificuldade]
    : CircleHelp;
  const titulo = conteudoVisivel ? opcao.titulo : "Confronto desconhecido";

  return (
    <button
      type="button"
      className={styles.noConfronto}
      data-escolhida={escolhida || undefined}
      data-descartada={descartada || undefined}
      data-disponivel={disponivel || undefined}
      data-desconhecido={!conteudoVisivel || undefined}
      data-dificuldade={conteudoVisivel ? opcao.dificuldade : undefined}
      style={{ "--no-x": `${posicao}%` } as CSSProperties}
      disabled={!disponivel || processando}
      onClick={() => onEscolher(opcao)}
      aria-label={
        conteudoVisivel ? `${opcao.titulo}, risco ${opcao.risco}` : titulo
      }
    >
      <span className={styles.iconeConfronto}>
        {escolhida ? <Check /> : descartada ? <LockKeyhole /> : <Icone />}
      </span>
      <span className={styles.textoConfronto}>
        <small>
          {conteudoVisivel ? `Risco ${opcao.risco}` : "Não explorado"}
        </small>
        <strong>{titulo}</strong>
        <em>
          {conteudoVisivel ? opcao.descricao : "Aproxime-se para revelar"}
        </em>
      </span>
      {disponivel ? <ChevronRight className={styles.setaConfronto} /> : null}
    </button>
  );
}

function NoChefe({
  expedicao,
  processando,
  batalhaEmAndamento,
  onEscolher,
}: {
  expedicao: EstadoExpedicao;
  processando: boolean;
  batalhaEmAndamento: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
}) {
  const disponivel = expedicao.chefe.status === "ATUAL" && !batalhaEmAndamento;
  const concluido = expedicao.chefe.status === "CONCLUIDA";
  const revelado = expedicao.chefe.status !== "BLOQUEADA";

  return (
    <button
      type="button"
      className={styles.noChefe}
      data-status={expedicao.chefe.status}
      data-disponivel={disponivel || undefined}
      disabled={!disponivel || processando}
      onClick={() => onEscolher(expedicao.chefe)}
    >
      <span className={styles.iconeChefe}>
        {concluido ? <Check /> : revelado ? <Flag /> : <CircleHelp />}
      </span>
      <span>
        <small>
          {concluido
            ? "Concluído"
            : revelado
              ? "Chefe da expedição"
              : "Destino oculto"}
        </small>
        <strong>
          {revelado ? expedicao.chefe.titulo : "Presença desconhecida"}
        </strong>
      </span>
      {disponivel ? <ChevronRight /> : null}
    </button>
  );
}

function ConexoesTrilha({
  expedicao,
  layout,
}: {
  expedicao: EstadoExpedicao;
  layout: LayoutTrilha;
}) {
  const conexoes: Array<{
    id: string;
    inicioX: number;
    inicioY: number;
    fimX: number;
    fimY: number;
    estado: EstadoConexao;
  }> = [];

  layout.posicoesX[0].forEach((fimX, indiceDestino) => {
    conexoes.push({
      id: `entrada-${indiceDestino}`,
      inicioX: 50,
      inicioY: 92,
      fimX,
      fimY: posicoesY[0] + 3,
      estado: estadoConexao(expedicao, -1, indiceDestino),
    });
  });

  for (let etapa = 0; etapa < layout.posicoesX.length - 1; etapa += 1) {
    layout.posicoesX[etapa].forEach((inicioX, indiceOrigem) => {
      layout.posicoesX[etapa + 1].forEach((fimX, indiceDestino) => {
        conexoes.push({
          id: `${etapa}-${indiceOrigem}-${indiceDestino}`,
          inicioX,
          inicioY: posicoesY[etapa] - 3,
          fimX,
          fimY: posicoesY[etapa + 1] + 3,
          estado: estadoConexao(expedicao, etapa, indiceDestino, indiceOrigem),
        });
      });
    });
  }

  layout.posicoesX.at(-1)?.forEach((inicioX, indiceOrigem) => {
    conexoes.push({
      id: `chefe-${indiceOrigem}`,
      inicioX,
      inicioY: posicoesY.at(-1)! - 3,
      fimX: 50,
      fimY: 13,
      estado: estadoConexaoChefe(expedicao, indiceOrigem),
    });
  });

  return (
    <svg
      className={styles.conexoesTrilha}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {conexoes.map((conexao) => {
        const meioY = (conexao.inicioY + conexao.fimY) / 2;
        const desvio = ((conexao.inicioX + conexao.fimX) % 9) - 4;
        return (
          <path
            d={`M ${conexao.inicioX} ${conexao.inicioY} C ${conexao.inicioX + desvio} ${meioY}, ${conexao.fimX - desvio} ${meioY}, ${conexao.fimX} ${conexao.fimY}`}
            data-estado={conexao.estado}
            vectorEffect="non-scaling-stroke"
            key={conexao.id}
          />
        );
      })}
    </svg>
  );
}

function estadoConexao(
  expedicao: EstadoExpedicao,
  etapaOrigem: number,
  indiceDestino: number,
  indiceOrigem = -1,
): EstadoConexao {
  const etapaDestino = etapaOrigem + 1;
  const escolhaOrigem =
    etapaOrigem < 0 ? -1 : buscarIndiceEscolhido(expedicao, etapaOrigem);
  const escolhaDestino = buscarIndiceEscolhido(expedicao, etapaDestino);
  const origemCorreta = etapaOrigem < 0 || escolhaOrigem === indiceOrigem;

  if (etapaDestino < expedicao.etapaAtual) {
    return origemCorreta && escolhaDestino === indiceDestino
      ? "percorrida"
      : "descartada";
  }
  if (etapaDestino === expedicao.etapaAtual) {
    return origemCorreta ? "disponivel" : "descartada";
  }
  return "futura";
}

function estadoConexaoChefe(
  expedicao: EstadoExpedicao,
  indiceOrigem: number,
): EstadoConexao {
  const ultimaEtapa = expedicao.etapas.length - 1;
  const escolhaOrigem = buscarIndiceEscolhido(expedicao, ultimaEtapa);
  if (expedicao.etapaAtual < expedicao.etapas.length) return "futura";
  if (escolhaOrigem !== indiceOrigem) return "descartada";
  return expedicao.chefe.status === "CONCLUIDA" ? "percorrida" : "disponivel";
}

function buscarIndiceEscolhido(
  expedicao: EstadoExpedicao,
  indiceEtapa: number,
) {
  return (
    expedicao.etapas[indiceEtapa]?.opcoes.findIndex((opcao) =>
      expedicao.escolhas.includes(opcao.id),
    ) ?? -1
  );
}

function gerarLayoutTrilha(seed: number, totalEtapas: number): LayoutTrilha {
  const random = criarRandomVisual(seed);
  const bases = [18, 50, 82];
  const posicoesX = Array.from({ length: totalEtapas }, (_, indiceEtapa) => {
    const deslocamento = (random() - 0.5) * 12;
    const sentido = indiceEtapa % 2 === 0 ? 1 : -1;
    return bases.map((base, indice) => {
      const zigZag =
        indice === 1 ? deslocamento * -0.35 : deslocamento * sentido;
      return Math.min(88, Math.max(12, base + zigZag));
    });
  });
  return { posicoesX };
}

function criarRandomVisual(seed: number) {
  let valor = seed >>> 0;
  return () => {
    valor += 0x6d2b79f5;
    let nmr = valor;
    nmr = Math.imul(nmr ^ (nmr >>> 15), nmr | 1);
    nmr ^= nmr + Math.imul(nmr ^ (nmr >>> 7), nmr | 61);
    return ((nmr ^ (nmr >>> 14)) >>> 0) / 4294967296;
  };
}

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}
