import { Heart, Shield, Swords } from "lucide-react";
import styles from "../styles/cartaVerso.module.css";

type PropsCartaVerso = {
  nome: string;
  raridade: string;
  elemento: string;
  classe?: string;
  hp: number;
  ataque: number;
  defesa: number;
};

export function CartaVerso({
  nome,
  raridade,
  elemento,
  classe,
  hp,
  ataque,
  defesa,
}: PropsCartaVerso) {
  return (
    <span className={styles.verso} data-elemento={elemento}>
      <span className={styles.brilho} aria-hidden="true" />
      <span className={styles.cabecalho}>
        <small>{raridade}</small>
        <strong>{nome}</strong>
        <span>{classe?.trim() || elemento}</span>
      </span>

      <span className={styles.atributos}>
        <span>
          <Heart aria-hidden="true" />
          <small>HP</small>
          <strong>{hp}</strong>
        </span>
        <span>
          <Swords aria-hidden="true" />
          <small>ATQ</small>
          <strong>{ataque}</strong>
        </span>
        <span>
          <Shield aria-hidden="true" />
          <small>DEF</small>
          <strong>{defesa}</strong>
        </span>
      </span>

      <small className={styles.dica}>Clique para voltar</small>
    </span>
  );
}
