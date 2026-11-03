import { BarChart3, Layers3, Swords, Trophy, X } from "lucide-react";

import { criarEstiloMolduraPerfil } from "../../../components/cartaMontada";
import type { PerfilPublico } from "../../../lib/perfil";
import cardStyles from "../../../styles/perfil/cardUsuario.module.css";
import resumoStyles from "../../../styles/perfil/painelPerfil.module.css";

export function CardUsuarioPublico({ perfil }: { perfil: PerfilPublico }) {
  return (
    <section className={cardStyles.cardUsuario}>
      <div className={cardStyles.identidadeUsuario}>
        <div className={cardStyles.avatarArea}>
          <span
            className={`${cardStyles.avatarUsuario} ${cardStyles.avatarSomenteLeitura} ${cardStyles[perfil.molduraClasse] ?? ""}`}
            style={{ backgroundImage: `url("${perfil.avatarUrl ?? "/avatar-padrao.svg"}")` }}
            role="img"
            aria-label={`Foto de ${perfil.nome}`}
          />
          {perfil.molduraUrl ? (
            <span
              className={cardStyles.molduraCartaAvatar}
              style={{
                ...criarEstiloMolduraPerfil(perfil.molduraConfig),
                backgroundImage: `url("${perfil.molduraUrl}")`,
              }}
              aria-hidden="true"
            />
          ) : null}
        </div>

        <div className={cardStyles.dadosUsuario}>
          <div className={cardStyles.nomeUsuario}><h2>{perfil.nome}</h2></div>
        </div>
        <div className={cardStyles.biografiaUsuario}>
          <span>Bio</span>
          <p>{perfil.biografia || "Este jogador ainda não escreveu uma biografia."}</p>
        </div>
      </div>

      <dl className={cardStyles.listaStats}>
        <div className={cardStyles.statVitoria}>
          <Swords aria-hidden="true" />
          <span><dt>Vitórias</dt><dd>{perfil.vitorias}</dd></span>
        </div>
        <div className={cardStyles.statDerrota}>
          <X aria-hidden="true" />
          <span><dt>Derrotas</dt><dd>{perfil.derrotas}</dd></span>
        </div>
        <div className={cardStyles.statRanking}>
          <Trophy aria-hidden="true" />
          <span><dt>Ranking</dt><dd>{perfil.pontos.toLocaleString("pt-BR")} pts</dd></span>
        </div>
      </dl>
    </section>
  );
}

export function ResumoContaPublico({ perfil }: { perfil: PerfilPublico }) {
  return (
    <section className={resumoStyles.cardResumo}>
      <h2><BarChart3 aria-hidden="true" /> Resumo da conta</h2>
      <dl className={resumoStyles.listaResumo}>
        <div><dt><Layers3 aria-hidden="true" /> Cartas obtidas</dt><dd>{perfil.cartasObtidas} / {perfil.totalCartas}</dd></div>
        <div><dt><Layers3 aria-hidden="true" /> Decks criados</dt><dd>{perfil.decksCriados}</dd></div>
        <div><dt><Swords aria-hidden="true" /> Partidas jogadas</dt><dd>{perfil.partidas}</dd></div>
      </dl>
    </section>
  );
}
