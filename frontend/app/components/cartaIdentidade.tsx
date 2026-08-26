import styles from "../styles/cartaIdentidade.module.css";

type ElementoCarta = "natureza" | "agua" | "fogo" | "sombra" | "luz";

export function CartaIdentidade({
  nome,
  raridade,
  elemento,
}: {
  nome: string;
  raridade: string;
  elemento: ElementoCarta;
}) {
  return (
    <span className={styles.identidade}>
      <span className={styles.titulo} data-elemento={elemento}>
        <strong>{nome}</strong>
        <small data-raridade={raridade}>{raridade}</small>
      </span>
    </span>
  );
}
