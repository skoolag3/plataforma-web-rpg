import { Bell, ChevronDown, UserRound } from "lucide-react";
import { IconeRuby } from "../../../components/iconeRuby";
import type { PerfilConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/perfilLayout.module.css";

type PropsTopoPerfil = {
  perfil: PerfilConta;
};

export function TopoPerfil({ perfil }: PropsTopoPerfil) {
  return (
    <header className={styles.topoPerfil}>
      <div className={styles.saldoTopo}>
        <span>
          <IconeRuby />
          {perfil.rubys.toLocaleString("pt-BR")}
        </span>
      </div>

      <button type="button" className={styles.btnNotificacao} aria-label="Notificações">
        <Bell aria-hidden="true" />
        <span />
      </button>

      <div className={styles.contaTopo}>
        <span className={styles.avatarTopo}>
          <UserRound aria-hidden="true" />
        </span>
        <span>
          <strong>{perfil.user}</strong>
          <small>Nível {perfil.nivel}</small>
        </span>
        <ChevronDown aria-hidden="true" />
      </div>
    </header>
  );
}
