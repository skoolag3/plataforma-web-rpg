"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import sharedStyles from "../../styles/admin/adminShared.module.css";

export type AdminPaginacaoProps = {
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  porPagina?: number;
  aoMudarPagina: (novaPagina: number) => void;
  ariaLabel?: string;
  className?: string;
};

export function paginasVisiveis(atual: number, total: number) {
  return [...new Set([1, atual - 1, atual, atual + 1, total])]
    .filter((numero) => numero >= 1 && numero <= total)
    .sort((a, b) => a - b);
}

export function AdminPaginacao({
  pagina,
  totalPaginas,
  totalItens,
  porPagina = 10,
  aoMudarPagina,
  ariaLabel = "Páginas da tabela",
  className,
}: AdminPaginacaoProps) {
  if (totalItens <= 0) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, totalItens);
  const paginas = paginasVisiveis(pagina, totalPaginas);

  return (
    <footer className={`${sharedStyles.rodapeTabela} ${className ?? ""}`.trim()}>
      <span>
        Mostrando {inicio}–{fim} de {totalItens}
      </span>
      {totalPaginas > 1 ? (
        <nav className={sharedStyles.paginacao} aria-label={ariaLabel}>
          <button
            type="button"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => aoMudarPagina(pagina - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          {paginas.map((numero, indice) => (
            <Fragment key={numero}>
              {indice > 0 && numero > paginas[indice - 1] + 1 ? (
                <span aria-hidden="true" className={sharedStyles.paginacaoReticencias}>
                  …
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Página ${numero}`}
                aria-current={pagina === numero ? "page" : undefined}
                onClick={() => aoMudarPagina(numero)}
              >
                {numero}
              </button>
            </Fragment>
          ))}
          <button
            type="button"
            aria-label="Próxima página"
            disabled={pagina >= totalPaginas}
            onClick={() => aoMudarPagina(pagina + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </nav>
      ) : null}
    </footer>
  );
}
