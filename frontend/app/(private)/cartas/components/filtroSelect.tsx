"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { styles } from "../styles";

type FiltroSelectProps = {
  rotulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
};

export function FiltroSelect({
  rotulo,
  valor,
  opcoes,
  aoAlterar,
}: FiltroSelectProps) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharAoClicarFora(evento: PointerEvent) {
      if (!raiz.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  return (
    <div
      className={styles.selectVisual}
      ref={raiz}
      data-open={aberto || undefined}
    >
      <span>{rotulo}</span>
      <button
        type="button"
        className={styles.selectTrigger}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        <strong>{valor}</strong>
        <ChevronDown aria-hidden="true" />
      </button>

      {aberto ? (
        <div className={styles.selectMenu} role="listbox" aria-label={rotulo}>
          {opcoes.map((opcao) => (
            <button
              type="button"
              role="option"
              aria-selected={opcao === valor}
              className={opcao === valor ? styles.selectOpcaoAtiva : undefined}
              key={opcao}
              onClick={() => {
                aoAlterar(opcao);
                setAberto(false);
              }}
            >
              {opcao}
              {opcao === valor ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
