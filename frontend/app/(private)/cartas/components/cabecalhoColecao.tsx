import { Trophy } from "lucide-react";

import { styles } from "../styles";
import type { ResumoColecao } from "../types";

export function CabecalhoColecao({ resumo }: { resumo: ResumoColecao }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titulo}>
        <h1>
          Coleção
          <span>
            <Trophy aria-hidden="true" />
          </span>
        </h1>
        <div className={styles.progressoLinha}>
          <strong>
            {resumo.cartasObtidas} / {resumo.totalCartas} cartas coletadas
          </strong>
          <span className={styles.barra} aria-hidden="true">
            <span style={{ width: `${resumo.percentual}%` }} />
          </span>
          <strong>{resumo.percentual}%</strong>
        </div>
      </div>
    </header>
  );
}
