import { Check, X } from "lucide-react";
import { avaliarSenha } from "../lib/senha";
import styles from "./indicadorSenha.module.css";

export function IndicadorSenha({ senha, id }: { senha: string; id?: string }) {
  const avaliacao = avaliarSenha(senha);
  const rotulo =
    avaliacao.pontuacao === 4
      ? "Forte"
      : avaliacao.pontuacao === 3
        ? "Boa"
        : avaliacao.pontuacao === 2
          ? "Média"
          : "Fraca";

  return (
    <section id={id} className={styles.indicador} aria-live="polite">
      <div className={styles.barras} aria-hidden="true">
        {Array.from({ length: 4 }).map((_, indice) => (
          <span
            key={indice}
            data-ativa={indice < avaliacao.pontuacao || undefined}
            data-forca={avaliacao.pontuacao}
          />
        ))}
      </div>
      <strong>{senha ? rotulo : "Crie uma senha segura"}</strong>
      <ul>
        {avaliacao.requisitos.map((item) => {
          const Icone = item.atendido ? Check : X;
          return (
            <li key={item.id} data-atendido={item.atendido || undefined}>
              <Icone aria-hidden="true" />
              {item.texto}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
