import { Trophy } from "lucide-react";

import { styles } from "../styles";
import type { ResumoColecao } from "../types";

export function CabecalhoColecao({ resumo, aoAbrirConquistas }: { resumo: ResumoColecao; aoAbrirConquistas: () => void }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titulo}>
        <div><h1>Minhas cartas</h1><p>{resumo.cartasObtidas} de {resumo.totalCartas} obtidas</p></div>
        <button type="button" className={styles.conquistas} onClick={aoAbrirConquistas}>
          <Trophy aria-hidden="true" /><span>Conquistas</span><strong>{resumo.percentual}%</strong>
        </button>
      </div>
    </header>
  );
}
