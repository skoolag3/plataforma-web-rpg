"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { PreferenciasConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/painelPerfil.module.css";

type PropsPreferenciasPerfil = {
  preferencias: PreferenciasConta;
  aoAtualizar: (preferencias: PreferenciasConta) => Promise<string>;
};

export function PreferenciasPerfil({
  preferencias,
  aoAtualizar,
}: PropsPreferenciasPerfil) {
  const [valores, setValores] = useState(preferencias);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => setValores(preferencias), [preferencias]);

  async function alternar(chave: keyof PreferenciasConta) {
    const novosValores = { ...valores, [chave]: !valores[chave] };
    setValores(novosValores);
    setSalvando(true);
    setMensagem("");
    setErro("");

    try {
      const resposta = await aoAtualizar(novosValores);
      setMensagem(resposta);
    } catch (erroCapturado) {
      setValores(valores);
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={styles.cardPreferencias}>
      <h2>
        <Settings aria-hidden="true" />
        Preferências
      </h2>

      <label>
        <input
          type="checkbox"
          checked={valores.receberNotificacoes}
          onChange={() => alternar("receberNotificacoes")}
          disabled={salvando}
        />
        <span>Receber notificações</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={valores.mostrarNoRanking}
          onChange={() => alternar("mostrarNoRanking")}
          disabled={salvando}
        />
        <span>Mostrar perfil no ranking</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={valores.ocultarHistorico}
          onChange={() => alternar("ocultarHistorico")}
          disabled={salvando}
        />
        <span>Ocultar histórico de partidas</span>
      </label>

      {salvando ? <small>Salvando...</small> : null}
      {mensagem ? <small className={styles.sucessoPreferencia}>{mensagem}</small> : null}
      {erro ? <small className={styles.erroPreferencia}>{erro}</small> : null}
    </section>
  );
}
