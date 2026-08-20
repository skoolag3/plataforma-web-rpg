import { BarChart3, Clock3, Layers3, Swords } from "lucide-react";
import { IconeRuby } from "../../../components/iconeRuby";
import type { PerfilConta } from "../../../lib/perfil";
import styles from "../../../styles/perfil/painelPerfil.module.css";

type PropsResumoConta = {
  perfil: PerfilConta;
};

export function ResumoConta({ perfil }: PropsResumoConta) {
  return (
    <section className={styles.cardResumo}>
      <h2>
        <BarChart3 aria-hidden="true" />
        Resumo da conta
      </h2>

      <dl className={styles.listaResumo}>
        <div>
          <dt>
            <Layers3 aria-hidden="true" />
            Cartas obtidas
          </dt>
          <dd>
            {perfil.cartasObtidas} / {perfil.totalCartas}
          </dd>
        </div>
        <div>
          <dt>
            <Layers3 aria-hidden="true" />
            Decks criados
          </dt>
          <dd>{perfil.decksCriados}</dd>
        </div>
        <div>
          <dt>
            <Swords aria-hidden="true" />
            Partidas jogadas
          </dt>
          <dd>{perfil.partidasJogadas}</dd>
        </div>
        <div className={styles.divisorResumo}>
          <dt>
            <IconeRuby />
            Rubys
          </dt>
          <dd>{perfil.rubys.toLocaleString("pt-BR")}</dd>
        </div>
        <div className={styles.divisorResumo}>
          <dt>
            <Clock3 aria-hidden="true" />
            Último login
          </dt>
          <dd>{perfil.ultimoLogin}</dd>
        </div>
      </dl>
    </section>
  );
}
