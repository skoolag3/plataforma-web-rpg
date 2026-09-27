import { LoaderCircle } from "lucide-react";
import { IconeRuby } from "../../../components/iconeRuby";
import styles from "../../../styles/gacha/gacha.module.css";

type SummonButtonProps = {
  quantidade: 1 | 10;
  custo: number;
  principal?: boolean;
  carregando: boolean;
  desabilitado: boolean;
  onClick: () => void;
};

export function SummonButton({ quantidade, custo, principal, carregando, desabilitado, onClick }: SummonButtonProps) {
  return (
    <button
      type="button"
      className={styles.summonButton}
      data-principal={principal || undefined}
      disabled={desabilitado || carregando}
      aria-busy={carregando}
      onClick={onClick}
    >
      <span>
        <strong>{carregando ? "Invocando..." : `Invocar ${quantidade}x`}</strong>
        <small>{quantidade === 10 ? "Melhor valor · 10% de economia" : "Uma chance. Sem compromisso."}</small>
      </span>
      <b>{carregando ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <IconeRuby />} {custo.toLocaleString("pt-BR")}</b>
    </button>
  );
}
