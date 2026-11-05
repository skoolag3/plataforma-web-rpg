"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "../styles/cadastroDocumentos.module.css";

export type DocumentoCadastro = "termos" | "privacidade";

export function CadastroDocumentos({
  documento,
  aoFechar,
}: {
  documento: DocumentoCadastro;
  aoFechar: () => void;
}) {
  useEffect(() => {
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") aoFechar();
    }

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [aoFechar]);

  return createPortal(
    <div
      className={styles.fundo}
      onMouseDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) aoFechar();
      }}
    >
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-documento-cadastro"
        aria-describedby="descricao-documento-cadastro"
      >
        <header className={styles.cabecalho}>
          <div>
            <small>AnimeCards</small>
            <h2 id="titulo-documento-cadastro">
              {documento === "termos" ? "Termos de Uso" : "Privacidade"}
            </h2>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar informações" autoFocus>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.conteudo} id="descricao-documento-cadastro">
          {documento === "termos" ? (
            <>
              <p>O AnimeCards é um jogo de cartas online. Ao criar uma conta, você concorda em usar o site de forma respeitosa e sem prejudicar outros jogadores ou o funcionamento do jogo.</p>
              <p>Você é responsável por proteger o acesso à sua conta. Cartas, Rubys e outros itens do jogo são recursos virtuais vinculados à conta.</p>
              <p>Contas usadas para fraude, exploração de falhas ou abuso podem ser restringidas. Funcionalidades e regras do jogo podem mudar conforme o projeto evolui.</p>
            </>
          ) : (
            <>
              <p>Usamos os dados de cadastro, como nome no jogo e e-mail, para criar e proteger sua conta. Guardamos também seu progresso, cartas e atividades necessárias ao funcionamento do jogo.</p>
              <p>Seu nome no jogo e informações públicas do perfil podem ser vistos por outros jogadores. Não exibimos sua senha; ela é usada apenas para autenticação.</p>
              <p>Você pode gerenciar seus dados de conta e solicitar a exclusão do perfil nas configurações. As imagens das cartas e do jogo são cadastradas pela administração.</p>
            </>
          )}
        </div>

        <footer className={styles.rodape}>
          <button type="button" onClick={aoFechar}>Entendi</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
