import { ChevronLeft, ChevronRight } from "lucide-react";

import { styles } from "../styles";

type PaginacaoProps = {
  paginaAtual: number;
  totalPaginas: number;
  aoAlterar: (pagina: number) => void;
};

export function Paginacao({
  paginaAtual,
  totalPaginas,
  aoAlterar,
}: PaginacaoProps) {
  return (
    <footer className={styles.paginacao}>
      <button
        type="button"
        className={styles.setaPagina}
        onClick={() => aoAlterar(Math.max(1, paginaAtual - 1))}
        disabled={paginaAtual === 1}
        aria-label="Página anterior"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      {Array.from({ length: totalPaginas }).map((_, index) => {
        const numero = index + 1;

        return (
          <button
            key={numero}
            type="button"
            className={
              numero === paginaAtual ? styles.paginaAtual : styles.paginaNumero
            }
            onClick={() => aoAlterar(numero)}
            aria-current={numero === paginaAtual ? "page" : undefined}
          >
            {numero}
          </button>
        );
      })}

      <button
        type="button"
        className={styles.setaPagina}
        onClick={() => aoAlterar(Math.min(totalPaginas, paginaAtual + 1))}
        disabled={paginaAtual === totalPaginas}
        aria-label="Próxima página"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </footer>
  );
}
