"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./controlesFormulario.module.css";

export type OpcaoSelect = {
  valor: string;
  label: string;
  labelCurto?: string;
  descricao?: string;
  icone?: ReactNode;
  cor?: string;
};

type SelectPadraoProps = {
  valor: string;
  opcoes: OpcaoSelect[];
  aoAlterar: (valor: string) => void;
  placeholder: string;
  rotulo?: string;
  className?: string;
  ariaLabel?: string;
};

export function SelectPadrao({
  valor,
  opcoes,
  aoAlterar,
  placeholder,
  rotulo,
  className = "",
  ariaLabel,
}: SelectPadraoProps) {
  const [aberto, setAberto] = useState(false);
  const [menuAcima, setMenuAcima] = useState(false);
  const [espacoMenu, setEspacoMenu] = useState(304);
  const raiz = useRef<HTMLDivElement>(null);
  const idMenu = useId();
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  useEffect(() => {
    function fecharAoClicarFora(evento: PointerEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    }

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  const conteudoAtual = selecionada ?? {
    valor: "",
    label: placeholder,
  };

  function abrirMenu() {
    const posicao = raiz.current?.getBoundingClientRect();
    if (posicao) {
      const abaixo = window.innerHeight - posicao.bottom - 16;
      const acima = posicao.top - 16;
      const alturaPrevista = Math.min(304, opcoes.length * 42 + 12);
      const abrirAcima = abaixo < alturaPrevista && acima > abaixo;
      setMenuAcima(abrirAcima);
      setEspacoMenu(Math.max(80, abrirAcima ? acima : abaixo));
    }
    setAberto(true);
  }

  return (
    <div
      ref={raiz}
      className={`${styles.selectRaiz} ${className}`}
      data-aberto={aberto || undefined}
      data-menu-acima={aberto && menuAcima || undefined}
      data-vazio={!selecionada || undefined}
      style={
        ({
          "--controle-cor": conteudoAtual.cor ?? undefined,
          "--espaco-menu": `${espacoMenu}px`,
        } as CSSProperties)
      }
    >
      {rotulo ? <span className={styles.rotulo}>{rotulo}</span> : null}
      <button
        type="button"
        className={styles.selectTrigger}
        aria-label={ariaLabel ?? rotulo ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idMenu}
        onClick={() => aberto ? setAberto(false) : abrirMenu()}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown" || evento.key === "Enter") {
            evento.preventDefault();
            abrirMenu();
          }
        }}
      >
        <span className={styles.valorAtual}>
          {conteudoAtual.icone}
          <strong>{conteudoAtual.labelCurto ?? conteudoAtual.label}</strong>
        </span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </button>

      {aberto ? (
        <div
          id={idMenu}
          className={styles.selectMenu}
          role="listbox"
          aria-label={ariaLabel ?? rotulo ?? placeholder}
        >
          {opcoes.map((opcao) => (
            <button
              type="button"
              role="option"
              aria-selected={opcao.valor === valor}
              data-selecionada={opcao.valor === valor || undefined}
              key={opcao.valor || "opcao-vazia"}
              style={{ "--controle-cor": opcao.cor ?? "#dbe4f4" } as CSSProperties}
              onClick={() => {
                aoAlterar(opcao.valor);
                setAberto(false);
              }}
            >
              <span className={styles.opcaoConteudo}>
                {opcao.icone}
                <span>
                  <strong>{opcao.label}</strong>
                  {opcao.descricao ? <small>{opcao.descricao}</small> : null}
                </span>
              </span>
              {opcao.valor === valor ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CampoBuscaProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  aoLimpar?: () => void;
};

export function CampoBusca({
  className = "",
  value,
  aoLimpar,
  ...props
}: CampoBuscaProps) {
  const preenchido = typeof value === "string" && value.length > 0;

  return (
    <label className={`${styles.campoBusca} ${className}`}>
      <Search aria-hidden="true" />
      <input type="search" value={value} {...props} />
      {preenchido && aoLimpar ? (
        <button type="button" onClick={aoLimpar} aria-label="Limpar busca">
          <X aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}
