"use client";

import {
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  Footprints,
  Gem,
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

const zoomMinimo = 0.72;
const zoomMaximo = 1.24;
const passoZoom = 0.08;

type PropsMapaExpedicao = {
  expedicao: EstadoExpedicao;
  processando: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
  onAbrirDialogoBoss: () => void;
};

type LayoutTrilha = {
  posicoesX: number[][];
  posicoesY: number[];
  checkpointsX: number[];
  checkpointsY: number[];
};

type EstadoConexao = "futura" | "disponivel" | "percorrida" | "descartada";

export function MapaExpedicao({
  expedicao,
  processando,
  onEscolher,
  onAbrirDialogoBoss,
}: PropsMapaExpedicao) {
  const [zoom, setZoom] = useState(1);
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const arrasteRef = useRef({
    ativo: false,
    inicioX: 0,
    inicioY: 0,
    origemX: 0,
    origemY: 0,
  });
  const batalhaEmAndamento = expedicao.partidaAtual?.status === "EM_ANDAMENTO";
  const layout = useMemo(
    () => gerarLayoutTrilha(expedicao.etapas.length),
    [expedicao.etapas.length],
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
    const viewport = viewportRef.current;
    const area = areaRef.current;
    const limiteX =
      viewport && area
        ? Math.max(
            80,
            (area.offsetWidth * zoom - viewport.clientWidth) / 2 + 40,
          )
        : 180;
    const limiteY =
      viewport && area
        ? Math.max(
            60,
            (area.offsetHeight * zoom - viewport.clientHeight) / 2 + 32,
          )
        : 100;
    setDeslocamento({
      x: limitar(
        arraste.origemX + event.clientX - arraste.inicioX,
        -limiteX,
        limiteX,
      ),
      y: limitar(
        arraste.origemY + event.clientY - arraste.inicioY,
        -limiteY,
        limiteY,
      ),
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
      if (!event.ctrlKey) return;
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
          <p>Avance pela trilha. Cada etapa revela três rotas possíveis.</p>
        </div>
        <div className={styles.infoMapa}>
          <small>Progresso da expedição</small>
          <strong>
            {Math.min(expedicao.etapaAtual + 1, expedicao.totalEtapas)} de{" "}
            {expedicao.totalEtapas}
          </strong>
          <span>{expedicao.rubysAssegurados} Rubys assegurados</span>
        </div>
      </header>

      <div className={styles.barraMapa}>
        <span>Ctrl + roda para zoom · arraste para explorar</span>
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
          ref={areaRef}
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
            <NoChefe
              expedicao={expedicao}
              processando={processando}
              batalhaEmAndamento={batalhaEmAndamento}
              onEscolher={onEscolher}
              onAbrirDialogo={onAbrirDialogoBoss}
            />
          </div>

          {expedicao.etapas.map((etapa) => {
            const conteudoVisivel = etapa.indice <= expedicao.etapaAtual;
            return (
              <div
                className={styles.fileiraEtapa}
                style={
                  {
                    "--etapa-y": `${layout.posicoesY[etapa.indice]}%`,
                  } as CSSProperties
                }
                key={etapa.indice}
              >
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
                      lado={
                        indiceOpcao === 0
                          ? "direita"
                          : indiceOpcao === etapa.opcoes.length - 1
                            ? "esquerda"
                            : "centro"
                      }
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

          {layout.checkpointsX.map((posicaoX, indice) => (
            <CheckpointTrilha
              key={`checkpoint-${indice}`}
              indice={indice}
              posicaoX={posicaoX}
              posicaoY={layout.checkpointsY[indice]}
              concluido={expedicao.etapaAtual > indice}
              atual={expedicao.etapaAtual === indice + 1}
            />
          ))}

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

function CheckpointTrilha({
  indice,
  posicaoX,
  posicaoY,
  concluido,
  atual,
}: {
  indice: number;
  posicaoX: number;
  posicaoY: number;
  concluido: boolean;
  atual: boolean;
}) {
  return (
    <div
      className={styles.checkpointTrilha}
      data-concluido={concluido || undefined}
      data-atual={atual || undefined}
      style={
        {
          "--checkpoint-x": `${posicaoX}%`,
          "--checkpoint-y": `${posicaoY}%`,
        } as CSSProperties
      }
    >
      <span>{concluido ? <Check /> : <Gem />}</span>
      <small>Checkpoint {indice + 1}</small>
    </div>
  );
}

function NoConfronto({
  opcao,
  posicao,
  lado,
  conteudoVisivel,
  escolhida,
  descartada,
  disponivel,
  processando,
  onEscolher,
}: {
  opcao: OpcaoExpedicao;
  posicao: number;
  lado: "direita" | "centro" | "esquerda";
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
  const titulo = conteudoVisivel ? opcao.titulo : "Desconhecido";

  return (
    <button
      type="button"
      className={styles.noConfronto}
      data-escolhida={escolhida || undefined}
      data-descartada={descartada || undefined}
      data-disponivel={disponivel || undefined}
      data-desconhecido={!conteudoVisivel || undefined}
      data-dificuldade={conteudoVisivel ? opcao.dificuldade : undefined}
      data-lado={lado}
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
          {conteudoVisivel
            ? `Risco ${opcao.risco} · ${opcao.recompensa} Rubys`
            : "Não explorado"}
        </small>
        <strong>{titulo}</strong>
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
  onAbrirDialogo,
}: {
  expedicao: EstadoExpedicao;
  processando: boolean;
  batalhaEmAndamento: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
  onAbrirDialogo: () => void;
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
      onClick={() =>
        expedicao.dialogoBoss
          ? onAbrirDialogo()
          : onEscolher(expedicao.chefe)
      }
      aria-label={
        disponivel && expedicao.dialogoBoss
          ? `Enfrentar ${expedicao.chefe.titulo}`
          : expedicao.chefe.titulo
      }
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
        <strong>{revelado ? expedicao.chefe.titulo : "Chefe oculto"}</strong>
      </span>
      {revelado ? (
        <span className={styles.recompensaChefe}>
          +{expedicao.chefe.recompensa}
          <Gem aria-hidden="true" />
          {disponivel ? <ChevronRight aria-hidden="true" /> : null}
        </span>
      ) : null}
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

  layout.posicoesX.forEach((posicoesEtapa, etapa) => {
    const posicaoY = layout.posicoesY[etapa];
    const inicioY = etapa === 0 ? 94 : layout.checkpointsY[etapa - 1] - 2;
    const estadoTrecho = estadoTrechoEtapa(expedicao, etapa);

    conexoes.push({
      id: `eixo-entrada-${etapa}`,
      inicioX: 50,
      inicioY,
      fimX: 50,
      fimY: posicaoY,
      estado: estadoTrecho,
    });

    posicoesEtapa.forEach((fimX, indiceOpcao) => {
      conexoes.push({
        id: `opcao-${etapa}-${indiceOpcao}`,
        inicioX: 50,
        inicioY: posicaoY,
        fimX,
        fimY: posicaoY,
        estado: estadoConexaoCheckpoint(expedicao, etapa, indiceOpcao),
      });
    });

    conexoes.push({
      id: `eixo-checkpoint-${etapa}`,
      inicioX: 50,
      inicioY: posicaoY,
      fimX: 50,
      fimY: layout.checkpointsY[etapa],
      estado: estadoTrecho,
    });
  });

  const ultimoCheckpoint = layout.checkpointsX.length - 1;
  conexoes.push({
    id: "checkpoint-chefe",
    inicioX: layout.checkpointsX[ultimoCheckpoint],
    inicioY: layout.checkpointsY[ultimoCheckpoint] - 2,
    fimX: 50,
    fimY: 8,
    estado:
      expedicao.etapaAtual < expedicao.etapas.length
        ? "futura"
        : expedicao.chefe.status === "CONCLUIDA"
          ? "percorrida"
          : "disponivel",
  });

  return (
    <svg
      className={styles.conexoesTrilha}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {conexoes.map((conexao) => (
        <path
          d={`M ${conexao.inicioX} ${conexao.inicioY} L ${conexao.fimX} ${conexao.fimY}`}
          data-estado={conexao.estado}
          vectorEffect="non-scaling-stroke"
          key={conexao.id}
        />
      ))}
    </svg>
  );
}

function estadoConexaoCheckpoint(
  expedicao: EstadoExpedicao,
  etapa: number,
  indiceOrigem: number,
): EstadoConexao {
  const escolha = buscarIndiceEscolhido(expedicao, etapa);
  if (etapa < expedicao.etapaAtual) {
    return escolha === indiceOrigem ? "percorrida" : "descartada";
  }
  if (etapa === expedicao.etapaAtual && escolha === -1) {
    return "disponivel";
  }
  if (etapa === expedicao.etapaAtual && escolha === indiceOrigem) {
    return "disponivel";
  }
  return etapa === expedicao.etapaAtual ? "descartada" : "futura";
}

function estadoTrechoEtapa(
  expedicao: EstadoExpedicao,
  indiceEtapa: number,
): EstadoConexao {
  if (indiceEtapa < expedicao.etapaAtual) return "percorrida";
  if (indiceEtapa === expedicao.etapaAtual) return "disponivel";
  return "futura";
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

function gerarLayoutTrilha(totalEtapas: number): LayoutTrilha {
  const posicoesY = Array.from(
    { length: totalEtapas },
    (_, indice) => 76 - indice * 24,
  );
  const posicoesX = Array.from({ length: totalEtapas }, () => [24, 50, 76]);
  const checkpointsY = posicoesY.map((posicao) => posicao - 10);
  const checkpointsX = checkpointsY.map(() => 50);
  return { posicoesX, posicoesY, checkpointsX, checkpointsY };
}

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}
