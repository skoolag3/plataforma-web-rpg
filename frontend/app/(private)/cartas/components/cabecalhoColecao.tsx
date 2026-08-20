import { ChevronDown, Trophy } from "lucide-react";

import { styles } from "../styles";
import type { ResumoColecao } from "../types";

export function CabecalhoColecao({ resumo }: { resumo: ResumoColecao }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titulo}>
        <div><h1>Coleção</h1><p>{resumo.cartasObtidas} de {resumo.totalCartas} cartas obtidas</p></div>
        <details className={styles.conquistas}>
          <summary><Trophy aria-hidden="true" /><span>Conquistas</span><strong>{resumo.percentual}%</strong><ChevronDown aria-hidden="true" /></summary>
          <div>
            <span><strong>Progresso da coleção</strong><small>{resumo.cartasObtidas} / {resumo.totalCartas}</small></span>
            <span className={styles.barra} aria-hidden="true"><span style={{ width: `${resumo.percentual}%` }} /></span>
            <p>Continue obtendo cartas para completar sua coleção.</p>
          </div>
        </details>
      </div>
    </header>
  );
}
