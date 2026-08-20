"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Flame, Gem, Leaf, Moon, Shapes, Shield, SlidersHorizontal, Waves, Zap } from "lucide-react";

import { styles } from "../styles";

type FiltroSelectProps = {
  rotulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
};

const elementos = {
  natureza: { icone: Leaf, cor: "#7ee757" },
  agua: { icone: Waves, cor: "#38bdf8" },
  fogo: { icone: Flame, cor: "#fb7185" },
  sombra: { icone: Moon, cor: "#c084fc" },
  luz: { icone: Zap, cor: "#facc15" },
};

function ValorFiltro({ rotulo, valor }: { rotulo: string; valor: string }) {
  const elemento = elementos[valor as keyof typeof elementos];
  const Icone = elemento?.icone
    ?? (rotulo === "Raridade" ? Gem : rotulo === "Classe" ? Shield : valor === "Todos" || valor === "Todas" ? SlidersHorizontal : Shapes);

  return (
    <span className={styles.valorFiltro} style={elemento ? { color: elemento.cor } : undefined} data-raridade={rotulo === "Raridade" ? valor : undefined}>
      <Icone aria-hidden="true" />
      <strong>{valor}</strong>
    </span>
  );
}

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
        <ValorFiltro rotulo={rotulo} valor={valor} />
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
              <ValorFiltro rotulo={rotulo} valor={opcao} />
              {opcao === valor ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
