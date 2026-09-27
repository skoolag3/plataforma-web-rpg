import { CircleX, DoorOpen, Flag, Gem, Trophy } from "lucide-react";
import type { EstadoExpedicao } from "../../lib/jogo";
import styles from "../../styles/expedicaoResultado.module.css";

const conteudoPorStatus = {
  CONCLUIDA: {
    titulo: "Expedição concluída",
    descricao: "O guardião foi derrotado e todas as recompensas foram asseguradas.",
    Icone: Trophy,
  },
  FALHOU: {
    titulo: "Expedição encerrada",
    descricao:
      "A derrota encerrou a trilha. Os checkpoints foram preservados e 70% da recompensa pendente foi resgatada.",
    Icone: CircleX,
  },
  ABANDONADA: {
    titulo: "Expedição abandonada",
    descricao: "A jornada foi interrompida, mas os Rubys já assegurados permanecem com você.",
    Icone: DoorOpen,
  },
} satisfies Record<
  Exclude<EstadoExpedicao["status"], "EM_ANDAMENTO">,
  { titulo: string; descricao: string; Icone: typeof Trophy }
>;

export function ResultadoExpedicao({
  expedicao,
}: {
  expedicao: EstadoExpedicao;
}) {
  if (expedicao.status === "EM_ANDAMENTO") return null;

  const conteudo = conteudoPorStatus[expedicao.status];
  const etapasConcluidas = expedicao.etapas.filter(
    (etapa) => etapa.status === "CONCLUIDA",
  ).length;
  const confrontosConcluidos =
    etapasConcluidas + (expedicao.chefe.status === "CONCLUIDA" ? 1 : 0);
  const Icone = conteudo.Icone;

  return (
    <section className={styles.resultado} data-status={expedicao.status}>
      <div className={styles.iconeResultado}>
        <Icone aria-hidden="true" />
      </div>
      <div className={styles.textoResultado}>
        <small>Resultado da última jornada</small>
        <h2>{conteudo.titulo}</h2>
        <p>{conteudo.descricao}</p>
      </div>
      <dl className={styles.resumoResultado}>
        <div>
          <dt>
            <Gem aria-hidden="true" /> Rubys obtidos
          </dt>
          <dd>{expedicao.rubysAssegurados}</dd>
        </div>
        <div>
          <dt>
            <Flag aria-hidden="true" /> Confrontos vencidos
          </dt>
          <dd>
            {confrontosConcluidos}/{expedicao.totalEtapas}
          </dd>
        </div>
        {expedicao.rubysPerdidos > 0 ? (
          <div>
            <dt>
              <CircleX aria-hidden="true" /> Perda na derrota
            </dt>
            <dd>-{expedicao.rubysPerdidos}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
