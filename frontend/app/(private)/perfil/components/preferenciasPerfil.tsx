"use client";

import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { PreferenciasConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/painelPerfil.module.css";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import { SecaoRecolhivel } from "./secaoRecolhivel";

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

  useEffect(() => setValores(preferencias), [preferencias]);

  async function alternar(chave: keyof PreferenciasConta) {
    const novosValores = { ...valores, [chave]: !valores[chave] };
    setValores(novosValores);
    setSalvando(true);

    try {
      const resposta = await aoAtualizar(novosValores);
      notificarSucesso(resposta, "Preferências atualizadas");
    } catch (erroCapturado) {
      setValores(valores);
      notificarErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SecaoRecolhivel
      titulo="Preferências"
      descricao="Privacidade e notificações"
      icone={Settings}
    >
      <div className={styles.listaPreferencias}>
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
      </div>
    </SecaoRecolhivel>
  );
}
