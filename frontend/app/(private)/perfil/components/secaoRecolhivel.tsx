import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "../../../styles/perfil/secaoRecolhivel.module.css";

type PropsSecaoRecolhivel = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  children: ReactNode;
  perigo?: boolean;
};

export function SecaoRecolhivel({
  titulo,
  descricao,
  icone: Icone,
  children,
  perigo = false,
}: PropsSecaoRecolhivel) {
  return (
    <details
      className={`${styles.secaoRecolhivel} ${perigo ? styles.perigo : ""}`}
    >
      <summary className={styles.resumoSecao}>
        <span className={styles.iconeSecao}>
          <Icone aria-hidden="true" />
        </span>
        <span className={styles.textoSecao}>
          <strong>{titulo}</strong>
          <small>{descricao}</small>
        </span>
        <ChevronDown className={styles.setaSecao} aria-hidden="true" />
      </summary>
      <div className={styles.conteudoSecao}>{children}</div>
    </details>
  );
}
