"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import styles from "./animated-file-upload.module.css";

export interface AnimatedFileUploadProps {
  accept?: string;
  className?: string;
  disabled?: boolean;
  maxSize?: number;
  multiple?: boolean;
  rotulo?: string;
  ajuda?: string;
  onFilesSelected: (files: File[]) => void;
}

const animacao = { type: "spring" as const, duration: 0.25, bounce: 0.1 };

function formatarTamanho(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function arquivoAceito(arquivo: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((tipo) => {
    const filtro = tipo.trim().toLowerCase();
    if (filtro.endsWith("/*")) return arquivo.type.toLowerCase().startsWith(filtro.slice(0, -1));
    if (filtro.startsWith(".")) return arquivo.name.toLowerCase().endsWith(filtro);
    return arquivo.type.toLowerCase() === filtro;
  });
}

export default function AnimatedFileUpload({
  accept = "image/png,image/jpeg,image/webp",
  className,
  disabled = false,
  maxSize,
  multiple = false,
  rotulo = "Imagem",
  ajuda,
  onFilesSelected,
}: AnimatedFileUploadProps) {
  const reduzirMovimento = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const contadorDrag = useRef(0);
  const [arrastando, setArrastando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState("");

  const selecionarArquivos = useCallback((novos: File[]) => {
    if (!novos.length) return;
    const aceitos = novos.filter((arquivo) => arquivoAceito(arquivo, accept) && (!maxSize || arquivo.size <= maxSize));
    if (aceitos.length !== novos.length) {
      setErro(`Use uma imagem válida${maxSize ? ` de até ${formatarTamanho(maxSize)}` : ""}.`);
    } else {
      setErro("");
    }
    if (!aceitos.length) return;
    const atualizados = multiple ? [...arquivos, ...aceitos] : aceitos.slice(0, 1);
    setArquivos(atualizados);
    onFilesSelected(atualizados);
  }, [accept, arquivos, maxSize, multiple, onFilesSelected]);

  function removerArquivo(indice: number) {
    const atualizados = arquivos.filter((_, posicao) => posicao !== indice);
    setArquivos(atualizados);
    onFilesSelected(atualizados);
  }

  function handleInputChange(evento: ChangeEvent<HTMLInputElement>) {
    selecionarArquivos(Array.from(evento.target.files ?? []));
    evento.target.value = "";
  }

  function handleDragEnter(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    if (disabled) return;
    contadorDrag.current += 1;
    setArrastando(true);
  }

  function handleDragLeave(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    contadorDrag.current = Math.max(0, contadorDrag.current - 1);
    if (!contadorDrag.current) setArrastando(false);
  }

  function handleDrop(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    contadorDrag.current = 0;
    setArrastando(false);
    if (!disabled) selecionarArquivos(Array.from(evento.dataTransfer.files));
  }

  function handleKeyDown(evento: KeyboardEvent<HTMLDivElement>) {
    if ((evento.key === "Enter" || evento.key === " ") && !disabled) {
      evento.preventDefault();
      inputRef.current?.click();
    }
  }

  return <div className={`${styles.upload} ${className ?? ""}`}>
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${rotulo}. Arraste uma imagem ou pressione para escolher`}
      aria-disabled={disabled}
      className={`${styles.area} ${arrastando ? styles.arrastando : ""} ${disabled ? styles.desativado : ""}`}
      animate={reduzirMovimento ? undefined : { scale: arrastando ? 1.02 : 1 }}
      transition={animacao}
      onClick={() => { if (!disabled) inputRef.current?.click(); }}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(evento) => evento.preventDefault()}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} disabled={disabled} className={styles.inputOculto} onClick={(evento) => evento.stopPropagation()} onChange={handleInputChange} tabIndex={-1} />
      <motion.svg aria-hidden="true" className={styles.iconeUpload} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
        animate={reduzirMovimento ? undefined : { y: arrastando ? -4 : 0, scale: arrastando ? 1.15 : 1 }} transition={animacao}>
        <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
      <AnimatePresence mode="wait" initial={false}>
        <motion.strong key={arrastando ? "soltar" : "escolher"} initial={reduzirMovimento ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduzirMovimento ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {arrastando ? "Solte a imagem aqui" : rotulo}
        </motion.strong>
      </AnimatePresence>
      <span>{ajuda ?? `Arraste ou clique para escolher${maxSize ? ` · Até ${formatarTamanho(maxSize)}` : ""}`}</span>
    </motion.div>
    <AnimatePresence>
      {erro ? <motion.p role="alert" className={styles.erro} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{erro}</motion.p> : null}
    </AnimatePresence>
    {arquivos.length ? <ul className={styles.lista} aria-label="Arquivos selecionados">
      <AnimatePresence initial={false}>
        {arquivos.map((arquivo, indice) => <motion.li key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`} layout={!reduzirMovimento} initial={reduzirMovimento ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={reduzirMovimento ? { opacity: 0 } : { opacity: 0, x: 24 }} transition={animacao}>
          <span className={styles.arquivoIcone} aria-hidden="true">▧</span>
          <span className={styles.arquivoInfo}><strong title={arquivo.name}>{arquivo.name}</strong><small>{formatarTamanho(arquivo.size)}</small></span>
          <button type="button" aria-label={`Remover ${arquivo.name}`} disabled={disabled} onClick={() => removerArquivo(indice)}>×</button>
        </motion.li>)}
      </AnimatePresence>
    </ul> : null}
  </div>;
}
