"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Gem,
  Shapes,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

import { obterElementoCarta } from "../../../components/elementosCarta";
import { styles } from "../styles";

type FiltroSelectProps = {
  rotulo: string;
  valor: string;
  opcoes: string[];
  aoAlterar: (valor: string) => void;
};

function ValorFiltro({ rotulo, valor }: { rotulo: string; valor: string }) {
  const elemento = obterElementoCarta(valor);
  const Icone =
    rotulo === "Raridade"
      ? Gem
      : rotulo === "Classe"
        ? Shield
        : valor === "Todos" || valor === "Todas"
          ? SlidersHorizontal
          : Shapes;

  return (
    <span
      className={styles.valorFiltro}
      style={elemento ? { color: elemento.cor } : undefined}
      data-raridade={rotulo === "Raridade" ? valor : undefined}
    >
      {elemento ? (
        <Image
          className={styles.iconeElementoFiltro}
          src={elemento.icone}
          width={18}
          height={18}
          alt=""
        />
      ) : (
        <Icone aria-hidden="true" />
      )}
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
