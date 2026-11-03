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
import { SwitchToggle } from "../../../../components/ui/switch";

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
      descricao="Privacidade e ranking"
      icone={Settings}
    >
      <div className={styles.listaPreferencias}>
        <div className={styles.preferenciaLinha}><SwitchToggle checked={valores.mostrarNoRanking} onChange={() => void alternar("mostrarNoRanking")} label="Mostrar perfil no ranking" disabled={salvando} /></div>
        <div className={styles.preferenciaLinha}><SwitchToggle checked={valores.ocultarHistorico} onChange={() => void alternar("ocultarHistorico")} label="Ocultar histórico de partidas" disabled={salvando} /></div>

        {salvando ? <small>Salvando...</small> : null}
      </div>
    </SecaoRecolhivel>
  );
}
