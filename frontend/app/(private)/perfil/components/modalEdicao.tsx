"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "../../../styles/perfil/modalPerfil.module.css";

type PropsModalEdicao = {
  titulo: string;
  descricao: string;
  aoFechar: () => void;
  children: ReactNode;
};

export function ModalEdicao({
  titulo,
  descricao,
  aoFechar,
  children,
}: PropsModalEdicao) {
  return (
    <div className={styles.fundoModal} role="presentation" onMouseDown={aoFechar}>
      <section
        className={styles.modalEdicao}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-perfil"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="titulo-modal-perfil">{titulo}</h2>
            <p>{descricao}</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
