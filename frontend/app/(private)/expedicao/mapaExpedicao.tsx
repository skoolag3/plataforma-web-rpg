"use client";

import {
  Check,
  ChevronRight,
  Flag,
  Footprints,
  LockKeyhole,
  Shield,
  Skull,
  Swords,
} from "lucide-react";
import type { EstadoExpedicao, OpcaoExpedicao } from "../../lib/jogo";
import styles from "../../styles/expedicao.module.css";

const iconeDificuldade = {
  FACIL: Shield,
  MEDIA: Swords,
  DIFICIL: Skull,
  CHEFE: Flag,
};

const posicoesX = [17, 50, 83];
const posicoesY = [74, 53, 32];

type PropsMapaExpedicao = {
  expedicao: EstadoExpedicao;
  processando: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
};

export function MapaExpedicao({
  expedicao,
  processando,
  onEscolher,
}: PropsMapaExpedicao) {
  const batalhaEmAndamento = expedicao.partidaAtual?.status === "EM_ANDAMENTO";
  const etapaVisivel = Math.min(expedicao.etapaAtual, expedicao.etapas.length);

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
          <p>As rotas descartadas não poderão ser acessadas depois.</p>
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

      <div className={styles.areaTrilha}>
        <div className={styles.nevoaTrilha} aria-hidden="true" />
        <ConexoesTrilha expedicao={expedicao} />

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
          const revelada = etapa.indice <= etapaVisivel;
          return (
            <div
              className={styles.fileiraEtapa}
              data-revelada={revelada || undefined}
              style={
                {
                  "--etapa-y": `${posicoesY[etapa.indice]}%`,
                } as React.CSSProperties
              }
              key={etapa.indice}
            >
              <span className={styles.labelEtapa}>
                Stage {etapa.indice + 1}
              </span>
              {revelada
                ? etapa.opcoes.map((opcao, indiceOpcao) => {
                    const escolhida = expedicao.escolhas.includes(opcao.id);
                    const descartada =
                      etapa.status === "CONCLUIDA" && !escolhida;
                    const disponivel =
                      etapa.status === "ATUAL" &&
                      !batalhaEmAndamento &&
                      expedicao.opcoesAtuais.some(
                        (item) => item.id === opcao.id,
                      );
                    return (
                      <NoConfronto
                        opcao={opcao}
                        posicao={posicoesX[indiceOpcao]}
                        escolhida={escolhida}
                        descartada={descartada}
                        disponivel={disponivel}
                        processando={processando}
                        onEscolher={onEscolher}
                        key={opcao.id}
                      />
                    );
                  })
                : null}
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

      <footer className={styles.legendaMapa}>
        <span>
          <i data-cor="disponivel" /> Caminho disponível
        </span>
        <span>
          <i data-cor="percorrido" /> Rota percorrida
        </span>
        <span>
          <i data-cor="bloqueado" /> Caminho descartado
        </span>
      </footer>
    </section>
  );
}

function NoConfronto({
  opcao,
  posicao,
  escolhida,
  descartada,
  disponivel,
  processando,
  onEscolher,
}: {
  opcao: OpcaoExpedicao;
  posicao: number;
  escolhida: boolean;
  descartada: boolean;
  disponivel: boolean;
  processando: boolean;
  onEscolher: (opcao: OpcaoExpedicao) => void;
}) {
  const Icone = iconeDificuldade[opcao.dificuldade];
  return (
    <button
      type="button"
      className={styles.noConfronto}
      data-escolhida={escolhida || undefined}
      data-descartada={descartada || undefined}
      data-disponivel={disponivel || undefined}
      data-dificuldade={opcao.dificuldade}
      style={{ "--no-x": `${posicao}%` } as React.CSSProperties}
      disabled={!disponivel || processando}
      onClick={() => onEscolher(opcao)}
      aria-label={`${opcao.titulo}, risco ${opcao.risco}`}
    >
      <span className={styles.iconeConfronto}>
        {escolhida ? <Check /> : descartada ? <LockKeyhole /> : <Icone />}
      </span>
      <span className={styles.textoConfronto}>
        <small>Risco {opcao.risco}</small>
        <strong>{opcao.titulo}</strong>
        <em>{opcao.descricao}</em>
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
        {concluido ? (
          <Check />
        ) : expedicao.chefe.status === "BLOQUEADA" ? (
          <LockKeyhole />
        ) : (
          <Flag />
        )}
      </span>
      <span>
        <small>{concluido ? "Concluído" : "Chefe da expedição"}</small>
        <strong>{expedicao.chefe.titulo}</strong>
      </span>
      {disponivel ? <ChevronRight /> : null}
    </button>
  );
}

function ConexoesTrilha({ expedicao }: { expedicao: EstadoExpedicao }) {
  const conexoes: Array<{
    id: string;
    inicioX: number;
    inicioY: number;
    fimX: number;
    fimY: number;
    estado: "disponivel" | "percorrido" | "descartado";
  }> = [];

  expedicao.etapas.forEach((etapa) => {
    if (etapa.indice > expedicao.etapaAtual) return;
    const etapaAnterior = etapa.indice - 1;
    const escolhaAnterior =
      etapaAnterior >= 0
        ? expedicao.etapas[etapaAnterior].opcoes.findIndex((opcao) =>
            expedicao.escolhas.includes(opcao.id),
          )
        : -1;
    const inicioX = escolhaAnterior >= 0 ? posicoesX[escolhaAnterior] : 50;
    const inicioY = etapaAnterior >= 0 ? posicoesY[etapaAnterior] - 3 : 92;
    const escolhaAtual = etapa.opcoes.findIndex((opcao) =>
      expedicao.escolhas.includes(opcao.id),
    );

    etapa.opcoes.forEach((opcao, indiceOpcao) => {
      const encerrada = etapa.indice < expedicao.etapaAtual;
      conexoes.push({
        id: `${etapa.indice}-${opcao.id}`,
        inicioX,
        inicioY,
        fimX: posicoesX[indiceOpcao],
        fimY: posicoesY[etapa.indice] + 2,
        estado: encerrada
          ? indiceOpcao === escolhaAtual
            ? "percorrido"
            : "descartado"
          : "disponivel",
      });
    });
  });

  if (expedicao.etapaAtual >= expedicao.etapas.length) {
    const ultimaEtapa = expedicao.etapas.at(-1);
    const indiceEscolha =
      ultimaEtapa?.opcoes.findIndex((opcao) =>
        expedicao.escolhas.includes(opcao.id),
      ) ?? 1;
    conexoes.push({
      id: "conexao-chefe",
      inicioX: posicoesX[Math.max(indiceEscolha, 0)],
      inicioY: posicoesY.at(-1)! - 3,
      fimX: 50,
      fimY: 14,
      estado:
        expedicao.chefe.status === "CONCLUIDA" ? "percorrido" : "disponivel",
    });
  }

  return (
    <svg
      className={styles.conexoesTrilha}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {conexoes.map((conexao) => {
        const meioY = (conexao.inicioY + conexao.fimY) / 2;
        return (
          <path
            d={`M ${conexao.inicioX} ${conexao.inicioY} C ${conexao.inicioX} ${meioY}, ${conexao.fimX} ${meioY}, ${conexao.fimX} ${conexao.fimY}`}
            data-estado={conexao.estado}
            vectorEffect="non-scaling-stroke"
            key={conexao.id}
          />
        );
      })}
    </svg>
  );
}
